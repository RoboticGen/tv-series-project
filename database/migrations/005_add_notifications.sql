BEGIN;

CREATE TYPE notification_type AS ENUM (
  'project_starred',
  'project_featured',
  'project_built',
  'project_unpublished',
  'project_commented',
  'comment_replied',
  'new_follower'
);

CREATE OR REPLACE FUNCTION notify_point_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, type, actor_id, project_id, points)
  VALUES (
    NEW.user_id,
    (CASE NEW.reason WHEN 'star_received' THEN 'project_starred' ELSE 'project_featured' END)::notification_type,
    NEW.actor_id, NEW.project_id, NEW.points
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_project_built()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, type, actor_id, project_id)
  SELECT p.author_id, 'project_built', NEW.user_id, p.id
  FROM projects p
  WHERE p.id = NEW.project_id AND p.author_id <> NEW.user_id
  ON CONFLICT (project_id, actor_id) WHERE type = 'project_built' DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_project_unpublished()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, type, actor_id, project_id, detail)
  VALUES (NEW.author_id, 'project_unpublished', NEW.reviewed_by, NEW.id, NEW.rejection_reason);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    INSERT INTO notifications (recipient_id, type, actor_id, project_id, comment_id)
    SELECT p.author_id, 'project_commented', NEW.user_id, p.id, NEW.id
    FROM projects p
    WHERE p.id = NEW.project_id AND p.author_id <> NEW.user_id;
  ELSE
    INSERT INTO notifications (recipient_id, type, actor_id, project_id, comment_id)
    SELECT c.user_id, 'comment_replied', NEW.user_id, NEW.project_id, NEW.id
    FROM comments c
    WHERE c.id = NEW.parent_comment_id AND c.user_id <> NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, type, actor_id)
  VALUES (NEW.followee_id, 'new_follower', NEW.follower_id)
  ON CONFLICT (recipient_id, actor_id) WHERE type = 'new_follower' DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  actor_id      UUID REFERENCES users (id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects (id) ON DELETE CASCADE,
  comment_id    UUID REFERENCES comments (id) ON DELETE CASCADE,
  points        INTEGER,
  detail        TEXT,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (recipient_id) WHERE read_at IS NULL;

CREATE UNIQUE INDEX uq_notifications_built
  ON notifications (project_id, actor_id) WHERE type = 'project_built';
CREATE UNIQUE INDEX uq_notifications_follower
  ON notifications (recipient_id, actor_id) WHERE type = 'new_follower';

CREATE TRIGGER trg_point_events_notify
  AFTER INSERT ON point_events
  FOR EACH ROW WHEN (NEW.reason IN ('star_received', 'project_featured'))
  EXECUTE FUNCTION notify_point_event();

CREATE TRIGGER trg_submissions_notify
  AFTER INSERT ON submissions
  FOR EACH ROW EXECUTE FUNCTION notify_project_built();

CREATE TRIGGER trg_projects_unpublished_notify
  AFTER UPDATE OF status ON projects
  FOR EACH ROW WHEN (OLD.status = 'published' AND NEW.status = 'rejected')
  EXECUTE FUNCTION notify_project_unpublished();

CREATE TRIGGER trg_comments_notify
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_comment();

CREATE TRIGGER trg_follows_notify
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

COMMIT;
