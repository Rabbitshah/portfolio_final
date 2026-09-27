CREATE TYPE "public"."message_status" AS ENUM('new', 'read', 'spam');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text NOT NULL,
	"status" "message_status" DEFAULT 'new' NOT NULL,
	"notified_at" timestamp with time zone
);
