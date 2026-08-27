SELECT
  u.id AS user_id,
  count(p.id) FILTER (
    WHERE
      (p.status = 'draft' :: project_status)
  ) AS draft_projects,
  count(p.id) FILTER (
    WHERE
      (p.status = 'pending_review' :: project_status)
  ) AS pending_projects,
  count(p.id) FILTER (
    WHERE
      (p.status = 'published' :: project_status)
  ) AS published_projects,
  count(p.id) FILTER (
    WHERE
      (p.status = 'rejected' :: project_status)
  ) AS rejected_projects,
  COALESCE(sum(p.like_count), (0) :: numeric) AS total_likes_received,
  COALESCE(sum(p.star_count), (0) :: numeric) AS total_stars_received,
  (
    SELECT
      count(*) AS count
    FROM
      submissions s
    WHERE
      (s.user_id = u.id)
  ) AS submissions_count
FROM
  (
    users u
    LEFT JOIN projects p ON ((p.author_id = u.id))
  )
GROUP BY
  u.id;