import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gameRooms } from "@/db/schema";
import { generateRoomCode } from "@/lib/room-code";
import { eq } from "drizzle-orm";

/**
 * POST /api/rooms — create a new game room.
 *
 * Body: { timeControl?: number, increment?: number, hostColor?: "white"|"black"|"random" }
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Sign in to play online" }, { status: 401 });
  }

  const body = await req.json();
  const timeControl: number = body.timeControl ?? 0; // seconds, 0 = casual
  const increment: number = body.increment ?? 0;
  const hostColor: string = body.hostColor ?? "white";

  if (!["white", "black", "random"].includes(hostColor)) {
    return NextResponse.json({ error: "Invalid hostColor" }, { status: 400 });
  }

  // Generate a unique room code (retry on collision)
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateRoomCode();
    const existing = await db
      .select({ id: gameRooms.id })
      .from(gameRooms)
      .where(eq(gameRooms.code, code))
      .limit(1);
    if (existing.length === 0) break;
    if (attempt === 4) {
      return NextResponse.json({ error: "Failed to generate unique room code" }, { status: 500 });
    }
  }

  const whiteTimeMs = timeControl > 0 ? timeControl * 1000 : null;
  const blackTimeMs = timeControl > 0 ? timeControl * 1000 : null;

  const [room] = await db
    .insert(gameRooms)
    .values({
      code,
      hostUserId: session.user.id,
      hostName: session.user.name,
      hostColor,
      timeControl,
      increment,
      whiteTimeMs,
      blackTimeMs,
    })
    .returning();

  return NextResponse.json({ room }, { status: 201 });
}
