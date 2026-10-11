"use client";

import PusherClient from "pusher-js";

/**
 * Client-side Pusher singleton.
 * Re-uses one connection across all components that import this module.
 *
 * The key and cluster are read from NEXT_PUBLIC_ env vars so they're
 * available in the browser bundle.
 *
 * Returns null if Pusher env vars are not configured — callers should
 * check for null and fall back to HTTP polling.
 */

let pusherClient: PusherClient | null = null;
let pusherInitAttempted = false;

export function getPusherClient(): PusherClient | null {
  if (!pusherInitAttempted) {
    pusherInitAttempted = true;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (key && cluster) {
      pusherClient = new PusherClient(key, {
        cluster,
        authEndpoint: "/api/pusher/auth",
      });
    } else {
      console.warn("[Pusher] NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER not set — real-time disabled, using HTTP polling fallback.");
    }
  }
  return pusherClient;
}
