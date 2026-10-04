import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gameRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPusherServer } from "@/lib/pusher-server";

/**
 * POST /api/rooms/[code]/move — record a move and relay it to the opponent.
 *
 * Body: { from, to, promotion?, fen, pgn, whiteTimeMs?, blackTimeMs? }
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
  const { from, to, promotion, fen, pgn, whiteTimeMs, blackTimeMs } = body;

  if (!from || !to || !fen) {
    return NextResponse.json({ error: "Missing move data" }, { status: 400 });
  }

  const [room] = await db
    .select()
    .from(gameRooms)
    .where(eq(gameRooms.code, upperCode));

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status !== "in_progress") {
    return NextResponse.json({ error: "Game is not in progress" }, { status: 409 });
  }

  // Verify the user is a participant
  const isParticipant =
    room.hostUserId === session.user.id || room.guestUserId === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Persist updated state
  await db
    .update(gameRooms)
    .set({
      currentFen: fen,
      pgn: pgn ?? room.pgn,
      whiteTimeMs: whiteTimeMs ?? room.whiteTimeMs,
      blackTimeMs: blackTimeMs ?? room.blackTimeMs,
      lastMoveAt: new Date(),
    })
    .where(eq(gameRooms.code, upperCode));

  // Relay move to the channel — both players receive it,
  // but the sender's client ignores its own moves.
  const pusher = getPusherServer();
  await pusher.trigger(`presence-room-${upperCode}`, "move", {
    from,
    to,
    promotion: promotion ?? null,
    fen,
    whiteTimeMs: whiteTimeMs ?? null,
    blackTimeMs: blackTimeMs ?? null,
    movedBy: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
