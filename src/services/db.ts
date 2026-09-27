import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { messages } from "@/db/schema";
import type { MessageStore } from "@/lib/contact/types";

export function createMessageStore(databaseUrl: string): MessageStore {
  const db = drizzle({ client: neon(databaseUrl) });
  return {
    async insert(message) {
      const [row] = await db
        .insert(messages)
        .values({
          name: message.name,
          email: message.email,
          body: message.body,
          ipHash: message.ipHash,
        })
        .returning({ id: messages.id });
      if (!row) throw new Error("Insert returned no row");
      return row.id;
    },
    async markNotified(id) {
      await db
        .update(messages)
        .set({ notifiedAt: new Date() })
        .where(eq(messages.id, id));
    },
  };
}
