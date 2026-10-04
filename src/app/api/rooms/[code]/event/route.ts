import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gameRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPusherServer } from "@/lib/pusher-server";

/**
 * POST /api/rooms/[code]/event — broadcast a game event (draw offer, resign, etc.)
 *
 * Body: { type: "draw-offer"|"draw-response"|"resign", payload?: object }
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
  const { type, payload } = body;

  const allowedTypes = ["draw-offer", "draw-response", "resign"];
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const [room] = await db
    .select()
    .from(gameRooms)
    .where(eq(gameRooms.code, upperCode));

  if (!room || room.status !== "in_progress") {
    return NextResponse.json({ error: "Game is not in progress" }, { status: 409 });
  }

  const isParticipant =
    room.hostUserId === session.user.id || room.guestUserId === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const pusher = getPusherServer();
  await pusher.trigger(`presence-room-${upperCode}`, type, {
    ...payload,
    fromUserId: session.user.id,
    fromName: session.user.name,
  });

  return NextResponse.json({ ok: true });
}
