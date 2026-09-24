-- =====================================================================
-- users
-- Google OAuth is the only login path -- there is no local password, so
-- google_id is the real identity and is what auth looks up on every
-- request; email is kept for display/contact and still unique.
-- =====================================================================
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id      TEXT NOT NULL UNIQUE,
  email          CITEXT NOT NULL UNIQUE,
  display_name   TEXT NOT NULL,
  -- Picture URL straight from the Google OAuth profile (the `picture`
  -- claim). No local generation/storage -- just refreshed from Google
  -- on login if it changes.
  avatar_url     TEXT,
  role           user_role NOT NULL DEFAULT 'student',
  -- Set by an admin; a disabled user can't sign in (enforced in the app).
  is_disabled    BOOLEAN NOT NULL DEFAULT false,
  bio            TEXT,
  -- Maintained by triggers on follows -- see adjust_follow_counts in
  -- 003_functions.sql. Do not write from app code.
  follower_count   BIGINT NOT NULL DEFAULT 0,
  following_count  BIGINT NOT NULL DEFAULT 0,
  -- Maintained by triggers on point_events -- see adjust_user_points in
  -- 003_functions.sql. Do not write from app code.
  points         BIGINT NOT NULL DEFAULT 0,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users (role);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- projects
-- Metadata + workflow state live here; the actual markdown body lives in
-- MongoDB (content_doc_id is that document's _id) and step/gallery images
-- live on local disk (see media_assets). Postgres owns everything that
-- needs relational integrity, transactions, or fast filtering -- not the
-- prose itself.
-- =====================================================================
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category          project_category NOT NULL,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  summary          TEXT NOT NULL,
  content_doc_id   TEXT NOT NULL,
  -- FK added after media_assets below (media_assets doesn't exist yet here).
  cover_image_id   UUID,
  status           project_status NOT NULL DEFAULT 'draft',
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  -- Set only by moderation takedowns now (status = 'rejected'); publishing
  -- itself has no reviewer and leaves these null.
  reviewed_by      UUID REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  -- Moderation takedown reason, not a pre-publish rejection reason.
  rejection_reason TEXT,
  published_at     TIMESTAMPTZ,
  view_count       BIGINT NOT NULL DEFAULT 0,
  -- Maintained by triggers in 005_indexes.sql's sibling tables -- see 003_functions.sql.
  like_count       BIGINT NOT NULL DEFAULT 0,
  star_count       BIGINT NOT NULL DEFAULT 0,
  comment_count    BIGINT NOT NULL DEFAULT 0,
  -- Weighted full-text vector: title matches rank above summary matches.
  -- GENERATED STORED so it's indexed like any other column and never
  -- goes stale relative to title/summary.
  search_vector    TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B')
  ) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only a moderation takedown ('rejected') requires an actor -- publishing
  -- is self-serve and has no reviewer.
  CONSTRAINT chk_projects_review_fields CHECK (
    status <> 'rejected'
    OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  CONSTRAINT chk_projects_published_at CHECK (
    (status = 'published') = (published_at IS NOT NULL)
  )
);

-- Browse/search/pagination indexes -----------------------------------
-- Public browse feed: newest published projects, optionally filtered by
-- category. Partial (WHERE status = 'published') keeps drafts and
-- rejected rows -- the majority of writes, none of the public reads --
-- out of the index entirely.
CREATE INDEX idx_projects_published_feed
  ON projects (published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_projects_category_published
  ON projects (category, published_at DESC)
  WHERE status = 'published';

-- Featured rail on the homepage.
CREATE INDEX idx_projects_featured
  ON projects (published_at DESC)
  WHERE is_featured AND status = 'published';

-- Mentor/admin moderation view over already-live projects, newest first --
-- same shape idx_projects_published_feed already provides, so no separate
-- index is needed; the old pre-publish pending_review queue is gone.

-- "My projects" dashboard.
CREATE INDEX idx_projects_author ON projects (author_id, status);

-- Full-text search (ranked) and trigram search (typo-tolerant / ILIKE '%..%').
CREATE INDEX idx_projects_search_vector ON projects USING GIN (search_vector);
CREATE INDEX idx_projects_title_trgm ON projects USING GIN (title gin_trgm_ops);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Emulated FK cascade -- see media_assets below for why this can't be a
-- real ON DELETE CASCADE.
CREATE TRIGGER trg_projects_cascade_media
  AFTER DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION cascade_delete_media_assets();


-- =====================================================================
-- media_assets
-- Local-disk image galleries for projects and submissions. file_path is
-- relative to a single configured storage root (e.g. STORAGE_ROOT env var
-- in the API) -- the DB never stores an absolute host path.
-- =====================================================================
CREATE TABLE media_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type  media_owner_type NOT NULL,
  owner_id    UUID NOT NULL,
  file_path   TEXT NOT NULL,
  alt_text    TEXT,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No single FOREIGN KEY on (owner_type, owner_id) -- Postgres can't
-- target two different tables from one constraint. Integrity is instead
-- enforced by triggers (defined in 003_functions.sql, attached below and
-- on projects/submissions): validate_media_asset_owner rejects an
-- owner_id that doesn't exist in the table owner_type names, and
-- cascade_delete_media_assets removes a project's/submission's rows when
-- it's deleted. Net effect matches a real FK -- existence-checked writes,
-- cascading deletes -- just emulated instead of declared.
CREATE INDEX idx_media_assets_owner ON media_assets (owner_type, owner_id, position);

CREATE TRIGGER trg_media_assets_validate_owner
  BEFORE INSERT OR UPDATE OF owner_type, owner_id ON media_assets
  FOR EACH ROW EXECUTE FUNCTION validate_media_asset_owner();

-- Deferred from the projects table above -- media_assets didn't exist yet
-- at that point. SET NULL (not CASCADE) so removing/replacing a cover
-- image never takes the project row down with it.
ALTER TABLE projects
  ADD CONSTRAINT fk_projects_cover_image
  FOREIGN KEY (cover_image_id) REFERENCES media_assets (id) ON DELETE SET NULL;


-- =====================================================================
-- project_likes
-- Simple "like" -- one row per (user, project), existence is the signal.
-- =====================================================================
CREATE TABLE project_likes (
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

CREATE INDEX idx_project_likes_project ON project_likes (project_id);

CREATE TRIGGER trg_project_likes_count
  AFTER INSERT OR DELETE ON project_likes
  FOR EACH ROW EXECUTE FUNCTION adjust_project_like_count();


-- =====================================================================
-- project_stars
-- "I'm going to build this" -- distinct from a like: it's what a learner
-- taps before they start their own build, and is what a submission
-- (below) is expected to follow.
-- =====================================================================
CREATE TABLE project_stars (
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

CREATE INDEX idx_project_stars_project ON project_stars (project_id);

CREATE TRIGGER trg_project_stars_count
  AFTER INSERT OR DELETE ON project_stars
  FOR EACH ROW EXECUTE FUNCTION adjust_project_star_count();


-- =====================================================================
-- submissions
-- A learner's own "I made it" build write-up against a project. Private
-- by default -- is_private = true means only user_id may read it; nothing
-- in this schema grants the project author or a mentor visibility, that
-- has to stay an explicit, separate share action if it's ever added.
-- Multiple attempts per project are allowed (no unique constraint), since
-- a learner might rebuild and want a second write-up.
-- =====================================================================
CREATE TABLE submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_doc_id  TEXT NOT NULL,
  is_private      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_project ON submissions (project_id);
CREATE INDEX idx_submissions_user ON submissions (user_id, created_at DESC);

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Emulated FK cascade -- see media_assets above for why this can't be a
-- real ON DELETE CASCADE.
CREATE TRIGGER trg_submissions_cascade_media
  AFTER DELETE ON submissions
  FOR EACH ROW EXECUTE FUNCTION cascade_delete_media_assets();


-- =====================================================================
-- collections
-- A user-curated, ordered set of projects (their own and/or others'),
-- Instructables-style. Public by default; is_private = true hides it from
-- everyone but owner_id. Only the owner may add/remove projects.
-- =====================================================================
CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private  BOOLEAN NOT NULL DEFAULT false,
  -- Maintained by trg_collection_items_count -- do not write from app code.
  item_count  BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collections_owner ON collections (owner_id);

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- collection_items
-- Membership + manual ordering (position) of projects within a collection.
-- =====================================================================
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


-- =====================================================================
-- comments
-- One level of threading: parent_comment_id is null for a top-level
-- comment, or points at one for a reply. A reply's own parent_comment_id
-- is never itself a reply -- enforced in the server action, not here (see
-- addComment) -- so there's no unbounded nesting to render. Only ever
-- addable to published projects (also enforced in the server action) so
-- this table can carry comments on unpublished/rejected projects only if
-- a project is later taken down.
-- =====================================================================
CREATE TABLE comments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_comment_id  UUID REFERENCES comments (id) ON DELETE CASCADE,
  body               TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_comments_body_not_blank CHECK (length(trim(body)) > 0)
);

CREATE INDEX idx_comments_project ON comments (project_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments (parent_comment_id);

CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION adjust_project_comment_count();


-- =====================================================================
-- follows
-- Follower/following counts only -- no personalized feed reads this
-- table today, it exists purely for the (follower_id, followee_id) edge
-- and the denormalized counts on users it maintains.
-- =====================================================================
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  followee_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),

  CONSTRAINT chk_follows_no_self_follow CHECK (follower_id <> followee_id)
);

CREATE INDEX idx_follows_followee ON follows (followee_id);

CREATE TRIGGER trg_follows_count
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION adjust_follow_counts();


-- =====================================================================
-- point_events
-- Builder points ledger: one row per award, written only by the
-- award_*_points triggers below. users.points is its running total.
-- =====================================================================
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
