"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CustomChessGame } from "@/components/CustomChessGame";
import { motion } from "framer-motion";
import Link from "next/link";

function PlayContent() {
  const { data: session, isPending } = authClient.useSession();
  const [showGuestNotice, setShowGuestNotice] = useState(false);

  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  useEffect(() => {
    // Only decide once session status is known (not while isPending)
    if (!isPending && !session) {
      setShowGuestNotice(true);
    }
  }, [isPending, session]);

  if (isPending) {
    return <div className="p-8 text-center font-medium">Loading...</div>;
  }

  // Show "Coming Soon" screen if mode is bot or friend
  if (mode === "bot" || mode === "friend") {
    const isBot = mode === "bot";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-2xl border-2 border-gray-900 bg-white p-8 shadow-[6px_6px_0px_#000]"
        >
          <div className="text-6xl mb-4">{isBot ? "🤖" : "👥"}</div>
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            Under Development
          </span>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isBot ? "Bot Mode Coming Soon!" : "Play with Friend Coming Soon!"}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {isBot
              ? "We are currently training our chess AI. In the meantime, enjoy a local pass & play match!"
              : "Online multiplayer lobbies and friend invites are under development. In the meantime, enjoy a local pass & play match!"}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/play?mode=local"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#000] transition-all"
            >
              Play Local Game
            </Link>
            <Link
              href="/modes"
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl border-2 border-gray-300 transition-all text-sm"
            >
              ← Choose Different Mode
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Mode title label
  const modeTitle =
    mode === "friend"
      ? "Play vs Friend"
      : mode === "local"
      ? "Play Local (Pass & Play)"
      : "Play Chess";

  return (
    <motion.div className="p-8 max-w-5xl mx-auto">
      {/* Plain inline banner — no scroll locking */}
      {showGuestNotice && (
        <motion.div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-yellow-400/40 bg-yellow-50/80 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-950/40 dark:text-yellow-200">
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
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{modeTitle}</h1>
        <Link
          href="/modes"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-300 transition-colors"
        >
          ⇄ Change Mode
        </Link>
      </div>

      <CustomChessGame />
    </motion.div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-medium">Loading...</div>}>
      <PlayContent />
    </Suspense>
  );
}