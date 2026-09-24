-- Lets an admin disable an account without deleting it (see the admin
-- user-management page, frontend/src/app/dashboard/admin). Mirrors what a
-- fresh `docker compose up -d` now creates via init/004_tables.sql -- see
-- database/README.md's "Changing the schema".
--
-- Enforced in the application layer: a disabled user can't sign in, and
-- an already-issued JWT session is dropped on its next refresh.

ALTER TABLE users
  ADD COLUMN is_disabled BOOLEAN NOT NULL DEFAULT false;
