import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gameRooms } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getPusherServer } from "@/lib/pusher-server";
import { Chess } from "chess.js";

/**
 * POST /api/rooms/[code]/move — record a move and relay it to the opponent.
 *
 * Body: { from, to, promotion? }
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
  const { from, to, promotion } = body;

  if (typeof from !== "string" || typeof to !== "string") {
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

  const isHost = room.hostUserId === session.user.id;
  const isGuest = room.guestUserId === session.user.id;
  if (!isHost && !isGuest) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const moverColor = isHost
    ? room.hostColor
    : room.hostColor === "white" ? "black" : "white";
  const chess = new Chess();
  try {
    if (room.pgn) chess.loadPgn(room.pgn);
    else chess.load(room.currentFen);
    const turnColor = chess.turn() === "w" ? "white" : "black";
    if (turnColor !== moverColor) {
      return NextResponse.json({ error: "It is not your turn" }, { status: 409 });
    }
    chess.move({ from, to, promotion });
  } catch {
    return NextResponse.json({ error: "Move is not legal for the current position" }, { status: 409 });
  }

  const now = new Date();
  let whiteTimeMs = room.whiteTimeMs;
  let blackTimeMs = room.blackTimeMs;
  if (room.timeControl > 0) {
    const elapsed = room.lastMoveAt
      ? Math.max(0, now.getTime() - room.lastMoveAt.getTime())
      : 0;
    if (moverColor === "white") {
      whiteTimeMs = Math.max(0, (whiteTimeMs ?? room.timeControl * 1000) - elapsed) + room.increment * 1000;
    } else {
      blackTimeMs = Math.max(0, (blackTimeMs ?? room.timeControl * 1000) - elapsed) + room.increment * 1000;
    }
  }

  // Compare the position read above so concurrent or stale moves cannot overwrite it.
  const [updated] = await db
    .update(gameRooms)
    .set({
      currentFen: chess.fen(),
      pgn: chess.pgn(),
      whiteTimeMs,
      blackTimeMs,
      lastMoveAt: now,
    })
    .where(and(
      eq(gameRooms.code, upperCode),
      eq(gameRooms.status, "in_progress"),
      eq(gameRooms.currentFen, room.currentFen),
    ))
    .returning({ currentFen: gameRooms.currentFen });

  if (!updated) {
    return NextResponse.json({ error: "Position changed; reload the latest move" }, { status: 409 });
  }

  // Relay move to the channel — both players receive it,
  // but the sender's client ignores its own moves. (non-fatal)
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`presence-room-${upperCode}`, "move", {
      from,
      to,
      promotion: promotion ?? null,
      fen: chess.fen(),
      pgn: chess.pgn(),
      whiteTimeMs,
      blackTimeMs,
      movedBy: session.user.id,
    });
  } catch (err) {
    console.error("[rooms/move] Pusher trigger failed (non-fatal):", err);
  }

  return NextResponse.json({ ok: true, fen: chess.fen(), pgn: chess.pgn(), whiteTimeMs, blackTimeMs });
}
