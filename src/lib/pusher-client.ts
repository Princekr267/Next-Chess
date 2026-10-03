"use client";

import PusherClient from "pusher-js";

/**
 * Client-side Pusher singleton.
 * Re-uses one connection across all components that import this module.
 *
 * The key and cluster are read from NEXT_PUBLIC_ env vars so they're
 * available in the browser bundle.
 */

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return pusherClient;
}
