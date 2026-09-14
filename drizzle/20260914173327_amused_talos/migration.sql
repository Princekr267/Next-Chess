ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "rating_before" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "rating_after" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "rating" integer DEFAULT 1200 NOT NULL;