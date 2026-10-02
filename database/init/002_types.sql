-- Enumerated types.
-- Kept as native ENUMs (not lookup tables) because these value sets are small,
-- closed, and change only through a migration -- never through app data entry.

CREATE TYPE user_role AS ENUM ('student', 'mentor', 'admin');

-- draft            -> author is still writing, not visible to anyone else
-- pending_review   -> vestigial; publishing is self-serve now, nothing sets this
-- published        -> live, visible in browse/search/featured -- author-published, no gate
-- rejected         -> repurposed as "unpublished/removed by moderation" -- a mentor/admin
--                     took an already-published project back down; author can republish
CREATE TYPE project_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');

-- Which parent row a media_assets row belongs to. Polymorphic on purpose:
-- projects and submissions both need an ordered image gallery with identical
-- shape, and duplicating the table would just duplicate every index/trigger.
CREATE TYPE media_owner_type AS ENUM ('project', 'submission');

-- Fixed, admin-defined taxonomy for a robotics/coding academy. A closed
-- set that only ever changes via a migration (ALTER TYPE ... ADD VALUE),
-- not through an admin UI -- hence an enum, not a categories table.
CREATE TYPE project_category AS ENUM (
  'robotics',
  'electronics',
  'iot',
  'coding_software',
  'ai_ml',
  'drones',
  'threed_printing',
  'sensors_automation',
  'competitions',
  'other'
);

-- Why a point_events row was written -- see award_*_points in
-- 003_functions.sql and points_for for each reason's value.
CREATE TYPE point_reason AS ENUM ('submission_created', 'project_featured', 'star_received');

CREATE TYPE notification_type AS ENUM (
  'project_starred',
  'project_featured',
  'project_built',
  'project_unpublished',
  'project_commented',
  'comment_replied',
  'new_follower'
);
