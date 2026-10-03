import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gameRooms, matches, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPusherServer } from "@/lib/pusher-server";
import { calculateNewRating, resultToScore } from "@/lib/elo";

/**
 * POST /api/rooms/[code]/finish — finalize a game.
 *
 * Body: { result: "white"|"black"|"draw", reason: string }
 *
 * Saves match records for both players (if both are logged in),
 * updates Elo ratings using actual opponent ratings (not phantom),
 * and broadcasts the result via Pusher.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const upperCode = code.toUpperCase();
  const body = await req.json();
  const { result, reason } = body;

  if (!["white", "black", "draw"].includes(result)) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const [room] = await db
    .select()
    .from(gameRooms)
    .where(eq(gameRooms.code, upperCode));

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status === "completed") {
    // Idempotent — already finished
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  // Mark room as completed
  await db
    .update(gameRooms)
    .set({ status: "completed", result, resultReason: reason ?? null })
    .where(eq(gameRooms.code, upperCode));

  // Determine who is white and who is black
  const hostIsWhite = room.hostColor === "white";
  const whiteUserId = hostIsWhite ? room.hostUserId : room.guestUserId;
  const blackUserId = hostIsWhite ? room.guestUserId : room.hostUserId;
  const whiteName = hostIsWhite ? room.hostName : (room.guestName ?? "Opponent");
  const blackName = hostIsWhite ? (room.guestName ?? "Opponent") : room.hostName;

  // Fetch both players' ratings
  const players: { id: string; rating: number }[] = [];
  for (const uid of [whiteUserId, blackUserId]) {
    if (uid) {
      const [u] = await db
        .select({ id: user.id, rating: user.rating })
        .from(user)
        .where(eq(user.id, uid));
      if (u) players.push(u);
    }
  }

  const whitePlayer = players.find((p) => p.id === whiteUserId);
  const blackPlayer = players.find((p) => p.id === blackUserId);

  // Calculate Elo for both players if both exist
  const whiteMatchResult =
    result === "white" ? "win" : result === "black" ? "loss" : "draw";
  const blackMatchResult =
    result === "black" ? "win" : result === "white" ? "loss" : "draw";

  let whiteRatingBefore: number | null = null;
  let whiteRatingAfter: number | null = null;
  let blackRatingBefore: number | null = null;
  let blackRatingAfter: number | null = null;

  if (whitePlayer && blackPlayer) {
    whiteRatingBefore = whitePlayer.rating;
    blackRatingBefore = blackPlayer.rating;
    whiteRatingAfter = calculateNewRating(
      whiteRatingBefore,
      blackRatingBefore,
      resultToScore(whiteMatchResult as "win" | "loss" | "draw"),
    );
    blackRatingAfter = calculateNewRating(
      blackRatingBefore,
      whiteRatingBefore,
      resultToScore(blackMatchResult as "win" | "loss" | "draw"),
    );

    // Update both user ratings
    await db.update(user).set({ rating: whiteRatingAfter }).where(eq(user.id, whitePlayer.id));
    await db.update(user).set({ rating: blackRatingAfter }).where(eq(user.id, blackPlayer.id));
  }

  // Save match records for both players
  if (whiteUserId) {
    await db.insert(matches).values({
      userId: whiteUserId,
      opponentType: "friend",
      playerColor: "white",
      player2Name: blackName,
      opponentUserId: blackUserId ?? undefined,
      roomCode: upperCode,
      result: whiteMatchResult,
      ratingBefore: whiteRatingBefore,
      ratingAfter: whiteRatingAfter,
    });
  }
  if (blackUserId) {
    await db.insert(matches).values({
      userId: blackUserId,
      opponentType: "friend",
      playerColor: "black",
      player2Name: whiteName,
      opponentUserId: whiteUserId ?? undefined,
      roomCode: upperCode,
      result: blackMatchResult,
      ratingBefore: blackRatingBefore,
      ratingAfter: blackRatingAfter,
    });
  }

  // Broadcast the result to both players
  const pusher = getPusherServer();
  await pusher.trigger(`presence-room-${upperCode}`, "game-ended", {
    result,
    reason: reason ?? null,
    whiteRatingBefore,
    whiteRatingAfter,
    blackRatingBefore,
    blackRatingAfter,
  });

  return NextResponse.json({
    ok: true,
    whiteRatingBefore,
    whiteRatingAfter,
    blackRatingBefore,
    blackRatingAfter,
  });
}
