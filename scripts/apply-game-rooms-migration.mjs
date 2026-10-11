import { neon } from "@neondatabase/serverless";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf8");

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Applying game_rooms and match schema updates to database...\n");

  // 1. Create game_rooms table
  await sql`
    CREATE TABLE IF NOT EXISTS "game_rooms" (
      "id" serial PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "host_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
      "host_name" text NOT NULL,
      "guest_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
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
  `;
  console.log("✓ Created table: game_rooms");

  // 2. Create index on game_rooms(code)
  await sql`
    CREATE INDEX IF NOT EXISTS "game_rooms_code_idx" ON "game_rooms" ("code");
  `;
  console.log("✓ Created index: game_rooms_code_idx");

  // 3. Add opponent_user_id to matches
  try {
    await sql`
      ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "opponent_user_id" text REFERENCES "user"("id") ON DELETE SET NULL;
    `;
    console.log("✓ Added column: matches.opponent_user_id");
  } catch (err) {
    console.log("matches.opponent_user_id:", err.message);
  }

  // 4. Add room_code to matches
  try {
    await sql`
      ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "room_code" text;
    `;
    console.log("✓ Added column: matches.room_code");
  } catch (err) {
    console.log("matches.room_code:", err.message);
  }

  console.log("\n✅ All schema updates applied successfully!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
