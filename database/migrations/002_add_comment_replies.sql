-- Adds one level of comment threading (replies) to an already-running
-- database. Mirrors what a fresh `docker compose up -d` now creates via
-- init/004_tables.sql -- see database/README.md's "Changing the schema".
--
-- A reply's own parent_comment_id is never itself a reply -- enforced in
-- the addComment server action, not here -- so there's no unbounded
-- nesting to render.

ALTER TABLE comments
  ADD COLUMN parent_comment_id UUID REFERENCES comments (id) ON DELETE CASCADE;

CREATE INDEX idx_comments_parent ON comments (parent_comment_id);
