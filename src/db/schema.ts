import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  date,
  time,
  integer,
  jsonb,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

// ── Company (workspace/tenant) ──
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logo: text("logo"),
  industry: varchar("industry", { length: 100 }).notNull().default("Other"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── User ──
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("owner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Session ──
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Category (per company) ──
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#6366f1"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Event (campaign) ──
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  budget: integer("budget"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Post ──
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  caption: text("caption"),
  platform: varchar("platform", { length: 50 }).notNull().default("Instagram"),
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTime: time("scheduled_time"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  imageUrl: text("image_url"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── ShareLink ──
export const shareLinks = pgTable("share_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Post Comments (for share link approval) ──
export const postComments = pgTable("post_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull().default("Client"),
  content: text("content").notNull(),
  isApproval: boolean("is_approval").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
