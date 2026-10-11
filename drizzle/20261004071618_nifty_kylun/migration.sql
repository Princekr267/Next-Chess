CREATE TABLE "game_rooms" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"host_user_id" text,
	"host_name" text NOT NULL,
	"guest_user_id" text,
	"guest_name" text,
	"host_color" text DEFAULT 'white' NOT NULL,
	"time_control" integer DEFAULT 0 NOT NULL,
	"increment" integer DEFAULT 0 NOT NULL,
	"current_fen" text DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' NOT NULL,
	"pgn" text DEFAULT '',
	"white_time_ms" integer,
	"black_time_ms" integer,
	"status" text DEFAULT 'waiting' NOT NULL,
	"result" text,
	"result_reason" text,
	"last_move_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "opponent_user_id" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "room_code" text;--> statement-breakpoint
CREATE INDEX "game_rooms_code_idx" ON "game_rooms" ("code");--> statement-breakpoint
ALTER TABLE "game_rooms" ADD CONSTRAINT "game_rooms_host_user_id_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "game_rooms" ADD CONSTRAINT "game_rooms_guest_user_id_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_opponent_user_id_user_id_fkey" FOREIGN KEY ("opponent_user_id") REFERENCES "user"("id") ON DELETE SET NULL;