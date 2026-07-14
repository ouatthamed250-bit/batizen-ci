import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const batizenUsers = pgTable("batizen_users", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  role: text("role").notNull().default("client"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const batizenProjects = pgTable("batizen_projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  city: text("city").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  imageUrl: text("image_url").notNull(),
  budgetFcfa: integer("budget_fcfa").notNull(),
  surfaceM2: integer("surface_m2").notNull(),
  rooms: integer("rooms").notNull(),
  progress: integer("progress").notNull().default(0),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const batizenQuotes = pgTable("batizen_quotes", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  projectSlug: text("project_slug").notNull(),
  label: text("label").notNull(),
  amountFcfa: integer("amount_fcfa").notNull(),
  status: text("status").notNull(),
  validUntil: text("valid_until").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const batizenMessages = pgTable("batizen_messages", {
  id: serial("id").primaryKey(),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  preview: text("preview").notNull(),
  channel: text("channel").notNull().default("app"),
  unread: boolean("unread").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const batizenMaterials = pgTable("batizen_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  averagePriceFcfa: integer("average_price_fcfa").notNull(),
  city: text("city").notNull(),
});

export type BatizenProject = typeof batizenProjects.$inferSelect;
export type BatizenQuote = typeof batizenQuotes.$inferSelect;
export type BatizenMessage = typeof batizenMessages.$inferSelect;
