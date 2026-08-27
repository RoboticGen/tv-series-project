-- Enumerated types.
-- Kept as native ENUMs (not lookup tables) because these value sets are small,
-- closed, and change only through a migration -- never through app data entry.

CREATE TYPE user_role AS ENUM ('student', 'mentor', 'admin');

-- draft            -> author is still writing, not visible to anyone else
-- pending_review   -> author asked to publish; sits in the mentor/admin queue
-- published        -> approved, visible in browse/search/featured
-- rejected         -> reviewed and declined; author can edit and resubmit (-> draft)
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
