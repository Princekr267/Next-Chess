import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher-server";

/**
 * POST /api/pusher/auth
 * Authenticates Pusher presence channels.
 * Called automatically by the Pusher client when subscribing to a presence- channel.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 403 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channel = params.get("channel_name");

  if (!socketId || !channel) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  const pusher = getPusherServer();

  const presenceData = {
    user_id: session.user.id,
    user_info: {
      name: session.user.name,
    },
  };

  const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
  return NextResponse.json(authResponse);
}
