import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { matches, user } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/user/profile
// Fetches the authenticated user's profile, tactical Elo rating, match stats, and chronological rating history for the chart.
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id));

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch all matches for this user ordered chronologically (oldest to newest)
  const userMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.userId, session.user.id))
    .orderBy(asc(matches.createdAt));

  const totalGames = userMatches.length;
  const wins = userMatches.filter((m) => m.result === "win").length;
  const losses = userMatches.filter((m) => m.result === "loss").length;
  const draws = userMatches.filter((m) => m.result === "draw").length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // Build rating history: starting point is 1200, followed by every match that has ratingAfter
  const ratedMatches = userMatches.filter((m) => m.ratingAfter !== null);

  const ratingHistory = [
    {
      id: 0,
      rating: 1200,
      ratingBefore: 1200,
      delta: 0,
      date: dbUser.createdAt.toISOString(),
      result: "start" as const,
      opponent: "Initial Calibration",
    },
    ...ratedMatches.map((m) => ({
      id: m.id,
      rating: m.ratingAfter!,
      ratingBefore: m.ratingBefore ?? m.ratingAfter!,
      delta: (m.ratingAfter ?? 0) - (m.ratingBefore ?? 0),
      date: m.createdAt.toISOString(),
      result: m.result as "win" | "loss" | "draw",
      opponent:
        m.opponentType === "local"
          ? m.player2Name || "Local Opponent"
          : `AI Bot (${m.botDifficulty || "Normal"})`,
    })),
  ];

  // Peak rating: highest rating in history or current rating (at least 1200)
  const allRatings = [1200, dbUser.rating, ...ratedMatches.map((m) => m.ratingAfter!)];
  const peakRating = Math.max(...allRatings);
  const lowestRating = Math.min(...allRatings);

  // Recent 5 matches (newest first)
  const recentMatches = [...userMatches].reverse().slice(0, 5);

  return NextResponse.json({
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified,
      image: dbUser.image,
      rating: dbUser.rating,
      createdAt: dbUser.createdAt.toISOString(),
    },
    stats: {
      totalGames,
      wins,
      losses,
      draws,
      winRate,
      peakRating,
      lowestRating,
      ratedGamesCount: ratedMatches.length,
    },
    ratingHistory,
    recentMatches,
  });
}

// PATCH /api/user/profile
// Updates the user's display name
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: "Name must be between 2 and 50 characters." },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(user)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning();

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        emailVerified: updated.emailVerified,
        image: updated.image,
        rating: updated.rating,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
