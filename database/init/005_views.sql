-- Dashboard: per-user stats, computed on read. Plain views (not
-- materialized) -- at this scale a GROUP BY over indexed FKs is cheap,
-- and a materialized view would just add a refresh schedule to operate.
-- Revisit as a MATERIALIZED VIEW only if pg_stat_statements shows this
-- query getting hot.
CREATE VIEW user_dashboard_stats AS
SELECT
  u.id AS user_id,
  COUNT(p.id) FILTER (WHERE p.status = 'draft')           AS draft_projects,
  -- Vestigial: publishing is self-serve now, so this is always 0. Column
  -- kept rather than dropped to avoid churning every dashboard query.
  COUNT(p.id) FILTER (WHERE p.status = 'pending_review')  AS pending_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'published')       AS published_projects,
  -- Featured is independent of status (a mentor/admin toggle on top of an
  -- already-published project), so this is a subset of published_projects,
  -- not a separate status bucket.
  COUNT(p.id) FILTER (WHERE p.is_featured)                AS featured_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'rejected')        AS rejected_projects,
  COALESCE(SUM(p.like_count), 0)                          AS total_likes_received,
  COALESCE(SUM(p.star_count), 0)                          AS total_stars_received,
  (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) AS submissions_count
FROM users u
LEFT JOIN projects p ON p.author_id = u.id
GROUP BY u.id;

-- Mentor/admin moderation view: already-live projects, newest first, for
-- post-hoc action (feature/unpublish) -- not a pre-publish gate.
CREATE VIEW published_projects_feed AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.author_id,
  u.display_name AS author_name,
  p.category,
  p.cover_image_id,
  p.is_featured,
  p.published_at
FROM projects p
JOIN users u ON u.id = p.author_id
WHERE p.status = 'published'
ORDER BY p.published_at DESC;

-- "My likes" / "My starred projects" pages -- a user looking back at what
-- they liked or starred. The PK on project_likes/project_stars is
-- (user_id, project_id), so filtering either view by user_id is an
-- index-only lookup, not a scan.
CREATE VIEW user_liked_projects AS
SELECT
  pl.user_id,
  pl.created_at AS liked_at,
  p.id AS project_id,
  p.title,
  p.slug,
  p.category,
  p.author_id,
  p.like_count,
  p.star_count
FROM project_likes pl
JOIN projects p ON p.id = pl.project_id;

CREATE VIEW user_starred_projects AS
SELECT
  ps.user_id,
  ps.started_at,
  p.id AS project_id,
  p.title,
  p.slug,
  p.category,
  p.author_id,
  p.like_count,
  p.star_count
FROM project_stars ps
JOIN projects p ON p.id = ps.project_id;
