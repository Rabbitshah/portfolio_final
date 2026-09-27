import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const messageStatus = pgEnum("message_status", ["new", "read", "spam"]);

// Contact-form messages. `ip_hash` is a salted hash, never the raw IP.
// `notified_at` stays null until the email to me was sent, so a failed send is findable.
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipHash: text("ip_hash").notNull(),
  status: messageStatus("status").notNull().default("new"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
});

export type NewMessage = typeof messages.$inferInsert;
