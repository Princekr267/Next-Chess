import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// POST /api/matches  -> save a finished match for the logged-in user
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { opponentType, botDifficulty, playerColor, player2Name, result } = body;

  // Basic validation — reject anything that doesn't match what the schema expects
  if (!["local", "bot"].includes(opponentType)) {
    return NextResponse.json({ error: "Invalid opponentType" }, { status: 400 });
  }
  if (!["white", "black"].includes(playerColor)) {
    return NextResponse.json({ error: "Invalid playerColor" }, { status: 400 });
  }
  if (!["win", "loss", "draw"].includes(result)) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(matches)
    .values({
      userId: session.user.id,
      opponentType,
      botDifficulty: botDifficulty ?? null,
      playerColor,
      player2Name: player2Name ?? null,
      result,
    })
    .returning();

  return NextResponse.json({ match: inserted }, { status: 201 });
}

// GET /api/matches -> list the logged-in user's match history, most recent first
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const history = await db
    .select()
    .from(matches)
    .where(eq(matches.userId, session.user.id))
    .orderBy(desc(matches.createdAt));

  return NextResponse.json({ matches: history });
}