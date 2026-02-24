import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// ─── Auth.js required tables ───────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
  ]
);

// ─── App tables ────────────────────────────────────────────────────────

export const favorites = pgTable("favorites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  destinationName: text("destination_name").notNull(),
  country: text("country").notNull(),
  destinationData: jsonb("destination_data").notNull(),
  tripInputData: jsonb("trip_input_data"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const sharedTrips = pgTable("shared_trips", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(10)),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  destinationName: text("destination_name").notNull(),
  country: text("country").notNull(),
  destinationData: jsonb("destination_data").notNull(),
  tripInputData: jsonb("trip_input_data"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  viewCount: integer("view_count").default(0).notNull(),
});
