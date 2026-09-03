-- Adds the Collections feature (user-curated, ordered sets of projects,
-- Instructables-style) to an already-running database. Mirrors what a
-- fresh `docker compose up -d` now creates via init/003_functions.sql and
-- init/004_tables.sql -- see database/README.md's "Changing the schema".

CREATE OR REPLACE FUNCTION adjust_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections SET item_count = item_count + 1 WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections SET item_count = item_count - 1 WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private  BOOLEAN NOT NULL DEFAULT false,
  item_count  BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collections_owner ON collections (owner_id);

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE collection_items (
  collection_id  UUID NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  project_id     UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  position       INT NOT NULL DEFAULT 0,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, project_id)
);

CREATE INDEX idx_collection_items_project ON collection_items (project_id);

CREATE TRIGGER trg_collection_items_count
  AFTER INSERT OR DELETE ON collection_items
  FOR EACH ROW EXECUTE FUNCTION adjust_collection_item_count();
