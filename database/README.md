# Database

PostgreSQL 16 schema for the RoboticGen Academy project platform, run in
Docker, alongside a MongoDB 7 container that stores the Markdown body of
every project/submission (see "Design notes" below).

## Run it

```bash
cd database
cp .env.example .env   # adjust credentials if needed
docker compose up -d
```

The scripts in `init/` run once, in filename order, only when the
`pgdata` volume is first created (empty data directory). To pick up
schema changes after that, write a migration instead of editing an
`init/*.sql` file in place — see "Changing the schema" below.

Connect with:

```
postgresql://roboticgen:roboticgen@localhost:5432/roboticgen
mongodb://roboticgen:roboticgen@localhost:27017
```

`frontend/.env` needs matching `MONGODB_URI`/`MONGODB_DB` values -- see
`frontend/.env.example`.

## Layout

| File | Contents |
|---|---|
| `init/001_extensions.sql` | `pgcrypto`, `citext`, `pg_trgm` |
| `init/002_types.sql` | `user_role`, `project_status`, `media_owner_type`, `project_category`, `point_reason`, `notification_type` enums |
| `init/003_functions.sql` | `updated_at` trigger fn, like/star counter-maintenance fns, builder points fns, notification fns |
| `init/004_tables.sql` | `users`, `projects`, `media_assets`, `project_likes`, `project_stars`, `submissions`, `collections`, `collection_items`, `point_events`, `notifications` |
| `init/005_views.sql` | `user_dashboard_stats`, `pending_review_queue`, `user_liked_projects`, `user_starred_projects` |
| `migrations/*.sql` | Schema changes applied after `init/` already ran once (see "Changing the schema" below) |
| `frontend/src/lib/db/schema.ts` | Drizzle model of the same schema (hand-maintained, see below) |

## Design notes

- **Markdown lives in MongoDB, not Postgres.** `projects.content_doc_id`
  and `submissions.content_doc_id` are the Mongo `_id` of the markdown
  document. Postgres owns everything that needs relational integrity,
  filtering, or transactions (workflow state, ownership, likes); Mongo
  owns the prose. The `mongo` service in `docker-compose.yml` runs it
  alongside Postgres; the app connects via `frontend/src/lib/db/mongo.ts`
  (a `MongoClient` singleton, mirroring the Postgres client pattern in
  `frontend/src/lib/db/index.ts`) and reads/writes bodies through the typed
  helpers in `frontend/src/lib/db/content.ts`. There is no schema migration
  for this -- it's a single `content_docs` collection, no fixed shape
  enforced by Mongo itself.
- **Images live in a private S3 bucket**, referenced by
  `media_assets.file_path` (the object key in `S3_BUCKET`, read by
  `frontend/src/lib/storage.ts` -- the bucket is never public, so
  every read goes through the ownership-checked
  `frontend/src/app/api/media/[id]/route.ts` instead of static hosting). `media_assets` is polymorphic
  (`owner_type` + `owner_id`) so projects and submissions share one
  gallery table instead of two identical ones. Postgres can't attach a
  single `FOREIGN KEY` to two different target tables, so this is
  emulated with triggers instead (`003_functions.sql`):
  `validate_media_asset_owner` rejects an insert/update whose `owner_id`
  doesn't exist in the table `owner_type` names (same `SQLSTATE` as a
  real FK violation), and `cascade_delete_media_assets` (attached to
  both `projects` and `submissions`) deletes the matching rows when the
  owner is deleted. Net effect matches a real FK; Prisma just can't see
  it as one (`schema.prisma`'s `MediaAsset` model has no `@relation` for
  the same reason).
- **Publish workflow**: `projects.status` moves
  `draft → pending_review → published | rejected`. A `CHECK` constraint
  requires `reviewed_by`/`reviewed_at` once a project is `published` or
  `rejected`, so an approval can't be forgotten. Only a `mentor` or
  `admin` role should be allowed (in the API/service layer) to move a
  project out of `pending_review`.
- **Avatars**: `users.avatar_url` is the picture URL straight from the
  Google OAuth profile (`picture` claim) — no server-side generation or
  storage. Refresh it from Google on login if you want it to stay current.
- **Collections** are a user-curated, ordered set of projects (their own
  and/or others'), Instructables-style. `collections` holds the metadata
  (`owner_id`, `title`, `slug`, `description`, `is_private`); only the
  owner may add/remove projects, enforced in the application layer, not
  the schema. `collection_items` is the membership/ordering join table
  (`position` for manual ordering); `item_count` on `collections` is a
  denormalized counter kept in sync by `trg_collection_items_count` /
  `adjust_collection_item_count`, same pattern as `like_count`/`star_count`.
- **Likes and stars are individually queryable, not just counted.**
  `project_likes`/`project_stars` have a `(user_id, project_id)` primary
  key, so "what did I like/star" is an index-only lookup, not a scan —
  see `user_liked_projects` / `user_starred_projects` below.
- **`like_count`/`star_count`** on `projects` are denormalized counters,
  kept in sync by triggers on `project_likes`/`project_stars` (see
  `003_functions.sql`). They exist so the browse/card-grid queries (by
  far the hottest read path) never need a join + `COUNT`.
- **Search**: `projects.search_vector` is a `GENERATED ALWAYS ... STORED`
  `tsvector` (title weighted above summary), backed by a GIN index, for
  ranked full-text search. A separate `pg_trgm` GIN index on `title`
  supports typo-tolerant/`ILIKE '%...%'` autocomplete. Browse/pagination
  itself is served by partial indexes scoped to `status = 'published'`
  (see `idx_projects_published_feed`, `idx_projects_category_published`,
  `idx_projects_featured`) so draft/rejected rows — most of the writes,
  none of the public reads — never bloat the index.
- **Categories are a fixed `project_category` enum, not a table.**
  The set (`robotics`, `electronics`, `iot`, `coding_software`, `ai_ml`,
  `drones`, `threed_printing`, `sensors_automation`, `competitions`,
  `other`) is closed and only ever changes via a migration
  (`ALTER TYPE project_category ADD VALUE ...`), never through an admin
  UI — there's no `categories` table to manage.
- **Builder points** are an append-only ledger (`point_events`) plus a
  denormalized total (`users.points`), both written only by triggers
  (`award_*_points`, `adjust_user_points` in `003_functions.sql`), same
  never-drift reasoning as `like_count`/`star_count`. Rules: +5 to a
  learner the first time they submit a build of someone else's project,
  +15 to the author the first time a project is featured, +3 to the author
  per distinct starrer (self-stars earn nothing). Publishing and likes earn
  nothing. Values live in one place, `points_for()`. Points are never taken
  back: partial unique indexes (`uq_point_events_*`) make each action pay
  at most once, so un-star/re-star or un-feature/re-feature can't farm
  points, and `project_id` is `ON DELETE SET NULL` so deleting a project
  keeps what was earned. Levels are derived from the total in the app
  (`frontend/src/components/builder-level.tsx`), not stored.
- **`user_dashboard_stats`**: per-user project counts by status plus
  totals received (likes, stars, submissions) — for the small dashboard.
- **`pending_review_queue`**: the mentor/admin approval queue, oldest
  first.
- **`user_liked_projects` / `user_starred_projects`**: what a user has
  liked / starred, for "my likes" and "my starred projects" pages.
- **Views have no foreign keys, by construction.** A view is a saved
  `SELECT`, not stored data, so Postgres can't attach a constraint to it
  — the relationship to `users`/`projects` lives entirely in the `JOIN`
  inside `init/005_views.sql`. In `frontend/src/lib/db/schema.ts`, the 4
  views are declared with Drizzle's `.existing()` so app code gets a
  typed `db.select().from(...)` target without Drizzle trying to manage
  their DDL — there's still no DB-enforced constraint tying a view's
  `user_id`/`project_id` columns back to `users`/`projects`. If a view's
  `SELECT` ever changes which column feeds `user_id`, that's on the
  application code that joins against it, not something the schema file
  can catch.

## Changing the schema

Once the `pgdata` volume exists, `init/*.sql` no longer runs. From here,
schema changes should go through a migration step -- a new numbered file
under `migrations/` (plain SQL, run against the running container) --
rather than editing these files in place. Keep `init/` as the from-scratch
bootstrap (still updated to match, so a fresh volume gets the same schema
directly) and let `migrations/` layer on top of it for databases that
already exist. `frontend/src/lib/db/schema.ts` is a hand-maintained TypeScript mirror of
this SQL for query typing; update it to match whenever a migration
changes a table/view shape, but it does not drive the schema itself —
`drizzle-kit push`/`generate` are not part of this workflow.

## Verifying indexes are used

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM projects
WHERE status = 'published' AND category = 'robotics'
ORDER BY published_at DESC
LIMIT 20;
-- expect: Index Scan using idx_projects_category_published
```
