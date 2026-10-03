
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
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------

export const userRole = pgEnum("user_role", ["student", "mentor", "admin"]);

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

export const pointReason = pgEnum("point_reason", [
  "submission_created",
  "project_featured",
  "star_received",
]);

export const notificationType = pgEnum("notification_type", [
  "project_starred",
  "project_featured",
  "project_built",
  "project_unpublished",
  "project_commented",
  "comment_replied",
  "new_follower",
]);

// ---------------------------------------------------------------------
// users
// ---------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("student"),
  isDisabled: boolean("is_disabled").notNull().default(false),
  bio: text("bio"),
  followerCount: bigint("follower_count", { mode: "number" }).notNull().default(0),
  followingCount: bigint("following_count", { mode: "number" }).notNull().default(0),
  points: bigint("points", { mode: "number" }).notNull().default(0),
  emailDigest: boolean("email_digest").notNull().default(false),
  emailMentorDigest: boolean("email_mentor_digest").notNull().default(true),
  lastDigestSentAt: timestamp("last_digest_sent_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  collections: many(collections),
}));


export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: projectCategory("category").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  contentDocId: text("content_doc_id").notNull(),
  coverImageId: uuid("cover_image_id"),
  status: projectStatus("status").notNull().default("draft"),
  isFeatured: boolean("is_featured").notNull().default(false),
  reviewedById: uuid("reviewed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  viewCount: bigint("view_count", { mode: "number" }).notNull().default(0),
  likeCount: bigint("like_count", { mode: "number" }).notNull().default(0),
  starCount: bigint("star_count", { mode: "number" }).notNull().default(0),
  commentCount: bigint("comment_count", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  collectionItems: many(collectionItems),
}));


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

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contentDocId: text("content_doc_id").notNull(),
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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


export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: uuid("parent_comment_id").references((): AnyPgColumn => comments.id, {
    onDelete: "cascade",
  }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
}));


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


export const pointEvents = pgTable("point_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: pointReason("reason").notNull(),
  points: integer("points").notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationType("type").notNull(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  points: integer("points"),
  detail: text("detail"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isPrivate: boolean("is_private").notNull().default(false),
  itemCount: bigint("item_count", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  owner: one(users, {
    fields: [collections.ownerId],
    references: [users.id],
  }),
  items: many(collectionItems),
}));


export const collectionItems = pgTable("collection_items", {
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  addedAt: timestamp("added_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id],
  }),
  project: one(projects, {
    fields: [collectionItems.projectId],
    references: [projects.id],
  }),
}));


export const userDashboardStats = pgView("user_dashboard_stats", {
  userId: uuid("user_id"),
  draftProjects: bigint("draft_projects", { mode: "number" }),
  pendingProjects: bigint("pending_projects", { mode: "number" }),
  publishedProjects: bigint("published_projects", { mode: "number" }),
  featuredProjects: bigint("featured_projects", { mode: "number" }),
  rejectedProjects: bigint("rejected_projects", { mode: "number" }),
  totalLikesReceived: bigint("total_likes_received", { mode: "number" }),
  totalStarsReceived: bigint("total_stars_received", { mode: "number" }),
  submissionsCount: bigint("submissions_count", { mode: "number" }),
}).existing();

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
