import { appendFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Mailer, MessageStore } from "@/lib/contact/types";

// Test doubles for the database and the mailer, used only when E2E_FAKE_SERVICES=1 (which
// src/env.ts refuses on Vercel production). Each call appends one JSON line to a file that the
// end-to-end tests read back.
export const FAKE_DIR = join(tmpdir(), "portfolio-e2e");
export const FAKE_MESSAGES_FILE = join(FAKE_DIR, "messages.jsonl");
export const FAKE_MAIL_FILE = join(FAKE_DIR, "mail.jsonl");

function record(file: string, entry: object): void {
  mkdirSync(FAKE_DIR, { recursive: true });
  appendFileSync(file, `${JSON.stringify(entry)}\n`);
}

export function createFakeStore(): MessageStore {
  return {
    async insert(message) {
      const id = randomUUID();
      record(FAKE_MESSAGES_FILE, { type: "insert", id, ...message });
      return id;
    },
    async markNotified(id) {
      record(FAKE_MESSAGES_FILE, { type: "notified", id });
    },
  };
}

export function createFakeMailer(): Mailer {
  return {
    async send(mail) {
      record(FAKE_MAIL_FILE, mail);
    },
  };
}
