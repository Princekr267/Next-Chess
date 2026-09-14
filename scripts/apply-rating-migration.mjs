// Run this script once to add the missing "rating" column to the "user" table
// Usage: node scripts/apply-rating-migration.mjs

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf8");

// Simple .env parser
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
  console.log("Applying missing schema changes to Neon database...\n");

  try {
    // 1. Add rating column to user table (default 1200, not null)
    await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "rating" integer NOT NULL DEFAULT 1200`;
    console.log("✓ Added column: user.rating (integer, default 1200)");
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log("✓ Column user.rating already exists — skipping.");
    } else {
      throw err;
    }
  }

  try {
    // 2. Add rating_before to matches (already in migration file, but ensure it's there)
    await sql`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "rating_before" integer`;
    console.log("✓ Added column: matches.rating_before");
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log("✓ Column matches.rating_before already exists — skipping.");
    } else {
      throw err;
    }
  }

  try {
    // 3. Add rating_after to matches
    await sql`ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "rating_after" integer`;
    console.log("✓ Added column: matches.rating_after");
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log("✓ Column matches.rating_after already exists — skipping.");
    } else {
      throw err;
    }
  }

  try {
    // 4. Add issuer to account (from the drizzle migration file)
    await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text`;
    console.log("✓ Added column: account.issuer");
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log("✓ Column account.issuer already exists — skipping.");
    } else {
      throw err;
    }
  }

  console.log("\n✅ All migrations applied successfully!");
  console.log("You can now restart your dev server and sign up/in normally.");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
