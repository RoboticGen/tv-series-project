SELECT
  p.id,
  p.title,
  p.slug,
  p.author_id,
  u.display_name AS author_name,
  p.category,
  p.created_at
FROM
  (
    projects p
    JOIN users u ON ((u.id = p.author_id))
  )
WHERE
  (p.status = 'pending_review' :: project_status)
ORDER BY
  p.created_at;