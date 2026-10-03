-- Weekly email digest preferences.

ALTER TABLE users
  ADD COLUMN email_digest         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN email_mentor_digest  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN last_digest_sent_at  TIMESTAMPTZ;
