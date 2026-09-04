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
    return (
      <div className="p-12 text-center text-amber-300 text-sm font-black tracking-wider uppercase">
        Loading Chess Base...
      </div>
    );
  }

  // Show "Coming Soon" screen if mode is bot or friend
  if (mode === "bot" || mode === "friend") {
    const isBot = mode === "bot";
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="camp-card-canvas max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-400 border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center mx-auto mb-4">
            {isBot ? (
              <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="12" x="3" y="6" rx="2" />
                <path d="M9 12h.01" />
                <path d="M15 12h.01" />
                <path d="M12 2v4" />
                <path d="m5 18-2 4" />
                <path d="m19 18 2 4" />
              </svg>
            ) : (
              <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )}
          </div>

          <span className="camp-badge camp-badge-orange mb-3">
            COMING SOON TO CHESS BASE
          </span>

          <h2 className="text-2xl font-black text-gray-950 mb-2">
            {isBot ? "Bot Engine In Training" : "Friend Duel Lobby"}
          </h2>
          <p className="text-gray-700 text-xs sm:text-sm mb-6 leading-relaxed font-medium">
            {isBot
              ? "Our AI tactical engine is undergoing calibration. In the meantime, play a local game on the carved board."
              : "Online room codes and friend lobbies are in development. In the meantime, enjoy pass & play on the local board."}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/play?mode=local"
              className="camp-btn camp-btn-ember w-full py-3 text-sm font-black shadow-[3px_3px_0px_#000000]"
            >
              Deploy Local Board
            </Link>
            <Link
              href="/modes"
              className="camp-btn camp-btn-white w-full py-2.5 text-xs font-bold text-gray-800 shadow-[2px_2px_0px_#000000]"
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
      ? "Friend Duel"
      : mode === "local"
      ? "Local Board (Pass & Play)"
      : "Chess Base Board";

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Guest Notice */}
      {showGuestNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between gap-4 rounded-2xl border-[2.5px] border-black bg-amber-400 p-4 text-xs sm:text-sm text-black shadow-[4px_4px_0px_#000000]"
        >
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-xl bg-black text-amber-400 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
              ♟
            </span>
            <div>
              <p className="font-black tracking-wide text-sm">
                PLAYING AS GUEST
              </p>
              <p className="mt-0.5 font-semibold text-black/80 text-xs leading-relaxed">
                Matches are not recorded on your record. Sign in to track wins, losses, and tactical statistics.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuestNotice(false)}
            className="shrink-0 camp-btn camp-btn-white text-xs py-1 px-3 font-black shadow-[2px_2px_0px_#000000]"
          >
            Got It
          </button>
        </motion.div>
      )}

      {/* Board Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3 pb-3 border-b-[2.5px] border-black/50">
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-black shadow-[1px_1px_0px_#000000]" />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {modeTitle}
          </h1>
          <span className="camp-badge camp-badge-yellow text-[10px] hidden sm:inline-flex">
            CHESS BASE
          </span>
        </div>

        <Link
          href="/modes"
          className="camp-btn camp-btn-yellow text-xs py-1.5 px-3.5 font-black shadow-[2px_2px_0px_#000000]"
        >
          ⇄ Change Mode
        </Link>
      </div>

      {/* Chess Game */}
      <div className="py-2 flex justify-center">
        <CustomChessGame />
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-amber-300 text-sm font-black tracking-wider uppercase">Loading Chess Base Board...</div>}>
      <PlayContent />
    </Suspense>
  );
}