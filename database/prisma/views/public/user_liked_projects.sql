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
FROM
  (
    project_likes pl
    JOIN projects p ON ((p.id = pl.project_id))
  );