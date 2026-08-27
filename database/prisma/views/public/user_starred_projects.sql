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
FROM
  (
    project_stars ps
    JOIN projects p ON ((p.id = ps.project_id))
  );