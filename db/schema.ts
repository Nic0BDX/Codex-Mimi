// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  expression: text("expression").notNull().default("joie"),
  pinHash: text("pin_hash"),
  salt: text("salt"),
  failures: integer("failures").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
});
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  profileId: text("profile_id").notNull(),
  expires: integer("expires").notNull(),
});
export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  host: text("host").notNull(),
  status: text("status").notNull().default("lobby"),
  players: text("players").notNull(),
  state: text("state"),
  version: integer("version").notNull().default(0),
  capacity: integer("capacity").notNull().default(2),
  roundLimit: integer("round_limit").notNull().default(40),
  updated: integer("updated").notNull(),
  created: integer("created").notNull(),
  winner: text("winner"),
});
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  room: text("room").notNull(),
  profile: text("profile").notNull(),
  body: text("body").notNull(),
  created: integer("created").notNull(),
});
export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  recipient: text("recipient").notNull(),
  room: text("room").notNull(),
  created: integer("created").notNull(),
});
