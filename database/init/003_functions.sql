-- Shared trigger functions. Defined before the tables that use them so the
-- later CREATE TRIGGER statements can reference them directly.

-- Keeps updated_at honest without relying on every application code path
-- remembering to set it.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Denormalized like_count / star_count on projects exist so the browse and
-- card-grid queries (the hot path) never have to join+COUNT project_likes /
-- project_stars. Kept in sync here instead of in application code so it can
-- never drift, no matter which service writes the like/star row.
CREATE OR REPLACE FUNCTION adjust_project_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET like_count = like_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET like_count = like_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION adjust_project_star_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET star_count = star_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET star_count = star_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Denormalized comment_count on projects, same reasoning as like_count/
-- star_count above -- keeps the card-grid/project-page hot path free of a
-- join+COUNT over comments.
CREATE OR REPLACE FUNCTION adjust_project_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET comment_count = comment_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET comment_count = comment_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Denormalized item_count on collections, same reasoning as like_count/
-- star_count above -- keeps collection list/card queries free of a
-- join+COUNT over collection_items.
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

-- Denormalized follower_count / following_count on users -- one row insert/
-- delete on follows touches both sides at once, so a single trigger
-- function (not a pair) handles both counters together.
CREATE OR REPLACE FUNCTION adjust_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.followee_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE users SET follower_count = follower_count - 1 WHERE id = OLD.followee_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- media_assets.owner_id is polymorphic (points at projects.id or
-- submissions.id depending on owner_type) -- a single column can't carry
-- two different FOREIGN KEY targets, so Postgres has no native way to
-- constrain it. These two functions emulate what a real FK would give:
-- existence-checking on write, and cascade delete on the owner's removal.

-- BEFORE INSERT/UPDATE: reject a media_assets row whose owner_id doesn't
-- actually exist in the table owner_type says it belongs to. Mirrors the
-- error a real FOREIGN KEY violation raises (same SQLSTATE), so callers
-- that already handle FK errors handle this the same way.
CREATE OR REPLACE FUNCTION validate_media_asset_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_type = 'project' THEN
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = NEW.owner_id) THEN
      RAISE EXCEPTION 'media_assets.owner_id % does not reference an existing project', NEW.owner_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  ELSIF NEW.owner_type = 'submission' THEN
    IF NOT EXISTS (SELECT 1 FROM submissions WHERE id = NEW.owner_id) THEN
      RAISE EXCEPTION 'media_assets.owner_id % does not reference an existing submission', NEW.owner_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- AFTER DELETE on projects/submissions: sweep their media_assets rows.
-- Attached to both tables (see 004_tables.sql); TG_TABLE_NAME tells this
-- one function which owner_type to clean up, so it doesn't need to be
-- duplicated per table.
CREATE OR REPLACE FUNCTION cascade_delete_media_assets()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_type media_owner_type;
BEGIN
  v_owner_type := CASE TG_TABLE_NAME
    WHEN 'projects' THEN 'project'::media_owner_type
    WHEN 'submissions' THEN 'submission'::media_owner_type
  END;
  DELETE FROM media_assets WHERE owner_type = v_owner_type AND owner_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
