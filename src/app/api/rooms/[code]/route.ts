import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gameRooms } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/rooms/[code] — fetch current room state.
 * Used for initial load, reconnection, and state recovery.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [room] = await db
    .select()
    .from(gameRooms)
    .where(eq(gameRooms.code, code.toUpperCase()));

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Determine this user's role and color
  const isHost = room.hostUserId === session.user.id;
  const isGuest = room.guestUserId === session.user.id;

  if (!isHost && !isGuest && room.status !== "waiting") {
    return NextResponse.json({ error: "Room is not open for joining" }, { status: 403 });
  }

  // Resolve the actual colors (handle "random" assignment)
  let hostActualColor = room.hostColor;
  if (hostActualColor === "random") {
    // Random was resolved at join time, infer from the DB
    // If guest hasn't joined yet, it's still random
    hostActualColor = "white"; // default until resolved
  }

  const myColor = isHost ? hostActualColor : hostActualColor === "white" ? "black" : "white";

  return NextResponse.json({
    room,
    myRole: isHost ? "host" : isGuest ? "guest" : "spectator",
    myColor,
  });
}
