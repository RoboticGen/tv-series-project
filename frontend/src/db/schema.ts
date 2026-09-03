// Hand-written Drizzle model of the schema defined in
// database/init/002_types.sql, 004_tables.sql and 005_views.sql.
//
// database/init/*.sql is the source of truth. This file is a TypeScript
// mirror of it for query typing -- schema changes go through the init
// SQL (+ a migration step), not by editing this file or `drizzle-kit
// push`/`generate` against it.
//
// A few things in database/init/*.sql cannot be expressed here and are
// called out inline below as NOT REPRESENTED, same as the Prisma schema
// this replaces used to do.

import {
  pgEnum,
  pgTable,
  pgView,
  uuid,
  text,
  boolean,
  bigint,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------

export const userRole = pgEnum("user_role", ["student", "mentor", "admin"]);

// pending_review is vestigial -- publishing is self-serve, nothing sets it.
// rejected is repurposed as "unpublished/removed by moderation" -- a
// mentor/admin took an already-published project back down; not a
// pre-publish rejection.
export const projectStatus = pgEnum("project_status", [
  "draft",
  "pending_review",
  "published",
  "rejected",
]);

export const mediaOwnerType = pgEnum("media_owner_type", [
  "project",
  "submission",
]);

export const projectCategory = pgEnum("project_category", [
  "robotics",
  "electronics",
  "iot",
  "coding_software",
  "ai_ml",
  "drones",
  "threed_printing",
  "sensors_automation",
  "competitions",
  "other",
]);

// ---------------------------------------------------------------------
// users
// ---------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleId: text("google_id").notNull().unique(),
  // NOT REPRESENTED: CITEXT column type -- Drizzle has no citext helper,
  // this is stored/typed as text. Case-insensitive uniqueness/comparison
  // still holds at the DB level from the init SQL.
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("student"),
  bio: text("bio"),
  // Denormalized, kept in sync by DB triggers on follows -- do not write from app code.
  followerCount: bigint("follower_count", { mode: "number" }).notNull().default(0),
  followingCount: bigint("following_count", { mode: "number" }).notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Kept in sync by trg_users_updated_at -- do not set from app code.
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects, { relationName: "projectAuthor" }),
  reviewedProjects: many(projects, { relationName: "projectReviewedBy" }),
  likes: many(projectLikes),
  stars: many(projectStars),
  submissions: many(submissions),
  comments: many(comments),
  following: many(follows, { relationName: "followerUser" }),
  followers: many(follows, { relationName: "followeeUser" }),
}));

// ---------------------------------------------------------------------
// projects
//
// NOT REPRESENTED (kept only in database/init/004_tables.sql):
//   - search_vector TSVECTOR GENERATED ALWAYS AS (...) STORED, plus its
//     GIN index and the pg_trgm GIN index on title.
//   - Partial indexes: idx_projects_published_feed,
//     idx_projects_category_published, idx_projects_featured.
//   - CHECK constraints chk_projects_review_fields and
//     chk_projects_published_at.
// ---------------------------------------------------------------------

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: projectCategory("category").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  // MongoDB _id of the markdown document. No FK -- Mongo is a separate store.
  contentDocId: text("content_doc_id").notNull(),
  // FK declared after media_assets in database/init/004_tables.sql (that
  // table doesn't exist yet at this point in the init script).
  coverImageId: uuid("cover_image_id"),
  status: projectStatus("status").notNull().default("draft"),
  // Toggled independently by a mentor/admin as a curatorial action --
  // never set automatically by publishing.
  isFeatured: boolean("is_featured").notNull().default(false),
  // Set only by moderation takedowns now (status = 'rejected'); publishing
  // itself has no reviewer and leaves these null.
  reviewedById: uuid("reviewed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  // Moderation takedown reason, not a pre-publish rejection reason.
  rejectionReason: text("rejection_reason"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  viewCount: bigint("view_count", { mode: "number" }).notNull().default(0),
  // Denormalized, kept in sync by DB triggers on project_likes -- do not write from app code.
  likeCount: bigint("like_count", { mode: "number" }).notNull().default(0),
  // Denormalized, kept in sync by DB triggers on project_stars -- do not write from app code.
  starCount: bigint("star_count", { mode: "number" }).notNull().default(0),
  // Denormalized, kept in sync by DB triggers on comments -- do not write from app code.
  commentCount: bigint("comment_count", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Kept in sync by trg_projects_updated_at -- do not set from app code.
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, {
    fields: [projects.authorId],
    references: [users.id],
    relationName: "projectAuthor",
  }),
  reviewedBy: one(users, {
    fields: [projects.reviewedById],
    references: [users.id],
    relationName: "projectReviewedBy",
  }),
  likes: many(projectLikes),
  stars: many(projectStars),
  submissions: many(submissions),
  comments: many(comments),
}));

// ---------------------------------------------------------------------
// media_assets
//
// owner_id points at either a Project.id or a Submission.id depending on
// owner_type. No single Postgres FOREIGN KEY can target two different
// tables from one column, so this is enforced at the DB level by
// triggers instead (validate_media_asset_owner, cascade_delete_media_assets
// in database/init/003_functions.sql) -- existence-checked on write,
// cascade-deleted with the owner, same net effect as a real FK. There is
// deliberately no `references()` here; resolve owner_id to a project or
// submission in application code based on owner_type.
// ---------------------------------------------------------------------

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerType: mediaOwnerType("owner_type").notNull(),
  ownerId: uuid("owner_id").notNull(),
  filePath: text("file_path").notNull(),
  altText: text("alt_text"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------
// project_likes
// ---------------------------------------------------------------------

export const projectLikes = pgTable("project_likes", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectLikesRelations = relations(projectLikes, ({ one }) => ({
  user: one(users, {
    fields: [projectLikes.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [projectLikes.projectId],
    references: [projects.id],
  }),
}));

// ---------------------------------------------------------------------
// project_stars
// ---------------------------------------------------------------------

export const projectStars = pgTable("project_stars", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectStarsRelations = relations(projectStars, ({ one }) => ({
  user: one(users, {
    fields: [projectStars.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [projectStars.projectId],
    references: [projects.id],
  }),
}));

// ---------------------------------------------------------------------
// submissions
// ---------------------------------------------------------------------

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // MongoDB _id of the markdown document.
  contentDocId: text("content_doc_id").notNull(),
  // true = only userId may read this submission. No other role is
  // granted access anywhere in this schema.
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Kept in sync by trg_submissions_updated_at -- do not set from app code.
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const submissionsRelations = relations(submissions, ({ one }) => ({
  project: one(projects, {
    fields: [submissions.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------
// comments
//
// NOT REPRESENTED (kept only in database/init/004_tables.sql):
//   - CHECK constraint chk_comments_body_not_blank.
// ---------------------------------------------------------------------

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------
// follows
//
// NOT REPRESENTED (kept only in database/init/004_tables.sql):
//   - CHECK constraint chk_follows_no_self_follow.
//   - Composite PRIMARY KEY (follower_id, followee_id) -- Drizzle has no
//     multi-column primaryKey() helper wired up here, so both columns are
//     just declared NOT NULL; the DB still enforces uniqueness.
// ---------------------------------------------------------------------

export const follows = pgTable("follows", {
  followerId: uuid("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followeeId: uuid("followee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "followerUser",
  }),
  followee: one(users, {
    fields: [follows.followeeId],
    references: [users.id],
    relationName: "followeeUser",
  }),
}));

// ---------------------------------------------------------------------
// Views (database/init/005_views.sql)
//
// Declared with `.existing()` so Drizzle never tries to manage their
// DDL -- the CREATE VIEW statements in 005_views.sql own that. These
// exist purely to give app code a typed `db.select().from(...)` target.
// ---------------------------------------------------------------------

export const userDashboardStats = pgView("user_dashboard_stats", {
  userId: uuid("user_id"),
  draftProjects: bigint("draft_projects", { mode: "number" }),
  // Vestigial: publishing is self-serve now, always reads 0.
  pendingProjects: bigint("pending_projects", { mode: "number" }),
  publishedProjects: bigint("published_projects", { mode: "number" }),
  featuredProjects: bigint("featured_projects", { mode: "number" }),
  rejectedProjects: bigint("rejected_projects", { mode: "number" }),
  totalLikesReceived: bigint("total_likes_received", { mode: "number" }),
  totalStarsReceived: bigint("total_stars_received", { mode: "number" }),
  submissionsCount: bigint("submissions_count", { mode: "number" }),
}).existing();

// Mentor/admin moderation view over already-live projects -- not a
// pre-publish queue. Replaces the old pending_review_queue.
export const publishedProjectsFeed = pgView("published_projects_feed", {
  id: uuid("id"),
  title: text("title"),
  slug: text("slug"),
  authorId: uuid("author_id"),
  authorName: text("author_name"),
  category: projectCategory("category"),
  coverImageId: uuid("cover_image_id"),
  isFeatured: boolean("is_featured"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
}).existing();

export const userLikedProjects = pgView("user_liked_projects", {
  userId: uuid("user_id"),
  likedAt: timestamp("liked_at", { withTimezone: true }),
  projectId: uuid("project_id"),
  title: text("title"),
  slug: text("slug"),
  category: projectCategory("category"),
  authorId: uuid("author_id"),
  likeCount: bigint("like_count", { mode: "number" }),
  starCount: bigint("star_count", { mode: "number" }),
}).existing();

export const userStarredProjects = pgView("user_starred_projects", {
  userId: uuid("user_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  projectId: uuid("project_id"),
  title: text("title"),
  slug: text("slug"),
  category: projectCategory("category"),
  authorId: uuid("author_id"),
  likeCount: bigint("like_count", { mode: "number" }),
  starCount: bigint("star_count", { mode: "number" }),
}).existing();
