import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gameRooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPusherServer } from "@/lib/pusher-server";

/**
 * POST /api/rooms/[code]/join — join an existing room as Player 2.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Sign in to play online" }, { status: 401 });
  }

  const upperCode = code.trim().toUpperCase();

  const [room] = await db
    .select()
    .from(gameRooms)
    .where(eq(gameRooms.code, upperCode));

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // If this user is already the host, let them re-enter their own room
  if (room.hostUserId === session.user.id) {
    const hostColor = room.hostColor === "black" ? "black" : "white";
    return NextResponse.json({
      room,
      myRole: "host" as const,
      myColor: hostColor,
    });
  }

  // Idempotent: if this user is already the guest, return the room as-is
  if (room.guestUserId === session.user.id) {
    const guestColor = room.hostColor === "black" ? "white" : "black";
    return NextResponse.json({
      room,
      myRole: "guest" as const,
      myColor: guestColor,
    });
  }

  if (room.status !== "waiting") {
    return NextResponse.json({ error: "Room is no longer open" }, { status: 409 });
  }

  // Resolve "random" host color now that guest is joining
  let resolvedHostColor = room.hostColor;
  if (resolvedHostColor === "random") {
    resolvedHostColor = Math.random() < 0.5 ? "white" : "black";
  }

  const [updated] = await db
    .update(gameRooms)
    .set({
      guestUserId: session.user.id,
      guestName: session.user.name,
      hostColor: resolvedHostColor,
      status: "in_progress",
    })
    .where(eq(gameRooms.code, upperCode))
    .returning();

  // Notify the host that the guest joined via Pusher (non-fatal)
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`presence-room-${upperCode}`, "player-joined", {
      guestUserId: session.user.id,
      guestName: session.user.name,
      hostColor: resolvedHostColor,
    });
  } catch (err) {
    console.error("[rooms/join] Pusher trigger failed (non-fatal):", err);
  }

  const guestColor = resolvedHostColor === "white" ? "black" : "white";

  return NextResponse.json({
    room: updated,
    myRole: "guest" as const,
    myColor: guestColor,
  });
}
