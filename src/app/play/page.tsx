"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { CustomChessGame } from "@/components/CustomChessGame";

export default function PlayPage() {
  const { data: session, isPending } = authClient.useSession();
  const [showGuestNotice, setShowGuestNotice] = useState(false);

  useEffect(() => {
    // Only decide once session status is known (not while isPending)
    if (!isPending && !session) {
      setShowGuestNotice(true);
    }
  }, [isPending, session]);

  if (isPending) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      {/* Plain inline banner — no scroll locking, no @base-ui modal */}
      {showGuestNotice && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-yellow-400/40 bg-yellow-50/80 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-950/40 dark:text-yellow-200">
          <div>
            <p className="font-medium">You're playing as a guest</p>
            <p className="mt-0.5 text-yellow-800 dark:text-yellow-300">
              Your game results won't be saved. Sign in to track wins, losses,
              and match history.
            </p>
          </div>
          <button
            onClick={() => setShowGuestNotice(false)}
            className="shrink-0 rounded-md px-3 py-1.5 font-medium hover:bg-yellow-200/60 dark:hover:bg-yellow-800/40"
          >
            Got it
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Play Chess</h1>
      <CustomChessGame />
    </div>
  );
}