-- Adds the builder points system to an already-running database. Mirrors
-- what a fresh `docker compose up -d` now creates via init/002_types.sql,
-- init/003_functions.sql and init/004_tables.sql -- see database/README.md's
-- "Changing the schema".
--
-- point_events is an append-only ledger; users.points is its denormalized
-- total. Points are awarded by triggers (never app code) and are never
-- taken back: un-starring, un-featuring or deleting a submission keeps the
-- points, and the partial unique indexes stop the same action paying twice.
--
-- Wrapped in a transaction so a failure part-way leaves nothing behind.

BEGIN;

CREATE TYPE point_reason AS ENUM ('submission_created', 'project_featured', 'star_received');

-- Single source of truth for how many points each action is worth.
-- Mirrored for display only in frontend/src/components/builder-level.tsx.
CREATE OR REPLACE FUNCTION points_for(reason point_reason)
RETURNS INTEGER AS $$
  SELECT CASE reason
    WHEN 'submission_created' THEN 5
    WHEN 'project_featured'   THEN 15
    WHEN 'star_received'      THEN 3
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION adjust_user_points()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET points = points + NEW.points WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET points = points - OLD.points WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- +5 to the builder, once per (builder, project). Building your own
-- project earns nothing -- authors can submit to it at any time.
CREATE OR REPLACE FUNCTION award_submission_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO point_events (user_id, reason, points, project_id)
  SELECT NEW.user_id, 'submission_created', points_for('submission_created'), p.id
  FROM projects p
  WHERE p.id = NEW.project_id AND p.author_id <> NEW.user_id
  ON CONFLICT (user_id, project_id) WHERE reason = 'submission_created' DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- +15 to the author the first time a project is featured.
CREATE OR REPLACE FUNCTION award_featured_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO point_events (user_id, reason, points, project_id)
  VALUES (NEW.author_id, 'project_featured', points_for('project_featured'), NEW.id)
  ON CONFLICT (project_id) WHERE reason = 'project_featured' DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- +3 to the author per star, once per (starrer, project). Self-stars earn
-- nothing.
CREATE OR REPLACE FUNCTION award_star_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO point_events (user_id, reason, points, project_id, actor_id)
  SELECT p.author_id, 'star_received', points_for('star_received'), p.id, NEW.user_id
  FROM projects p
  WHERE p.id = NEW.project_id AND p.author_id <> NEW.user_id
  ON CONFLICT (project_id, actor_id) WHERE reason = 'star_received' DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Maintained by triggers on point_events -- see adjust_user_points. Do not
-- write from app code.
ALTER TABLE users ADD COLUMN points BIGINT NOT NULL DEFAULT 0;

CREATE TABLE point_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who earned the points.
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reason      point_reason NOT NULL,
  points      INTEGER NOT NULL,
  -- SET NULL, not CASCADE: deleting a project must not take back points
  -- already earned from it.
  project_id  UUID REFERENCES projects (id) ON DELETE SET NULL,
  -- Who caused the event, when that's someone else (the starrer).
  actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_events_user ON point_events (user_id, created_at DESC);

-- One award per action, ever -- what makes un-star/re-star (etc.) unable
-- to farm points.
CREATE UNIQUE INDEX uq_point_events_submission
  ON point_events (user_id, project_id) WHERE reason = 'submission_created';
CREATE UNIQUE INDEX uq_point_events_featured
  ON point_events (project_id) WHERE reason = 'project_featured';
CREATE UNIQUE INDEX uq_point_events_star
  ON point_events (project_id, actor_id) WHERE reason = 'star_received';

CREATE TRIGGER trg_point_events_total
  AFTER INSERT OR DELETE ON point_events
  FOR EACH ROW EXECUTE FUNCTION adjust_user_points();

CREATE TRIGGER trg_submissions_points
  AFTER INSERT ON submissions
  FOR EACH ROW EXECUTE FUNCTION award_submission_points();

CREATE TRIGGER trg_projects_featured_points
  AFTER UPDATE OF is_featured ON projects
  FOR EACH ROW WHEN (NEW.is_featured AND NOT OLD.is_featured)
  EXECUTE FUNCTION award_featured_points();

CREATE TRIGGER trg_project_stars_points
  AFTER INSERT ON project_stars
  FOR EACH ROW EXECUTE FUNCTION award_star_points();

-- Projects taken down before unpublishProject cleared is_featured still
-- carry the flag. Clear it first so they aren't shown as featured or paid
-- for below. (The featured trigger only fires on false -> true.)
UPDATE projects SET is_featured = false
WHERE is_featured AND status <> 'published';

-- Backfill: credit everything that happened before this migration, with
-- the same rules the triggers apply. Goes through trg_point_events_total,
-- so users.points ends up correct too.
INSERT INTO point_events (user_id, reason, points, project_id, created_at)
SELECT DISTINCT ON (s.user_id, s.project_id)
  s.user_id, 'submission_created', points_for('submission_created'), s.project_id, s.created_at
FROM submissions s
JOIN projects p ON p.id = s.project_id
WHERE p.author_id <> s.user_id
ORDER BY s.user_id, s.project_id, s.created_at;

INSERT INTO point_events (user_id, reason, points, project_id, created_at)
SELECT p.author_id, 'project_featured', points_for('project_featured'), p.id,
  COALESCE(p.published_at, p.updated_at)
FROM projects p
WHERE p.is_featured;

INSERT INTO point_events (user_id, reason, points, project_id, actor_id, created_at)
SELECT p.author_id, 'star_received', points_for('star_received'), p.id, ps.user_id, ps.started_at
FROM project_stars ps
JOIN projects p ON p.id = ps.project_id
WHERE p.author_id <> ps.user_id;

COMMIT;
