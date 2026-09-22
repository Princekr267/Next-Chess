"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CustomChessGame } from "@/components/CustomChessGame";
import { motion } from "framer-motion";
import Link from "next/link";

// ── Shared types & constants ──────────────────────────────────────────────────

/** All game modes the app supports (scalable — add "ranked" / "puzzle" etc. later). */
export type GameMode = "local" | "bot" | "friend";

const GUEST_NOTICE_DISMISSED_KEY = "next_chess_guest_notice_dismissed";

/** Mode display metadata — single source of truth for labels, icons, badges. */
const MODE_META: Record<
  GameMode,
  { label: string; shortLabel: string; icon: string; badgeClass: string }
> = {
  local: {
    label: "Local Board (Pass & Play)",
    shortLabel: "Local",
    icon: "🏠",
    badgeClass: "camp-badge-teal",
  },
  bot: {
    label: "vs Base Bot",
    shortLabel: "Bot",
    icon: "🤖",
    badgeClass: "camp-badge-orange",
  },
  friend: {
    label: "Friend Duel",
    shortLabel: "Friend",
    icon: "⚔️",
    badgeClass: "camp-badge-violet",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveMode(raw: string | null): GameMode {
  if (raw === "bot" || raw === "friend" || raw === "local") return raw;
  return "local"; // default fallback
}

function isGuestNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(GUEST_NOTICE_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function persistGuestNoticeDismissal(): void {
  try {
    localStorage.setItem(GUEST_NOTICE_DISMISSED_KEY, "true");
  } catch {
    // Incognito / storage-full — fail silently
  }
}

// ── Main Play Content ────────────────────────────────────────────────────────

function PlayContent() {
  const { data: session, isPending } = authClient.useSession();
  const [showGuestNotice, setShowGuestNotice] = useState(false);

  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"));
  const meta = MODE_META[mode];

  useEffect(() => {
    // Show notice only once session status is known, user is guest, and not dismissed before
    if (!isPending && !session && !isGuestNoticeDismissed()) {
      setShowGuestNotice(true);
    }
  }, [isPending, session]);

  function handleDismissGuestNotice() {
    setShowGuestNotice(false);
    persistGuestNoticeDismissal();
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
          <div className="w-16 h-16 rounded-2xl bg-amber-200 flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: "4px 4px 10px rgba(28,18,6,0.4), inset -3px -3px 7px rgba(28,18,6,0.25), inset 3px 3px 7px rgba(255,215,140,0.5)" }}
          >
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
            COMING SOON TO NEXT-CHESS
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
              className="camp-btn camp-btn-ember w-full py-3 text-sm font-black"
            >
              Deploy Local Board
            </Link>
            <Link
              href="/modes"
              className="camp-btn camp-btn-white w-full py-2.5 text-xs font-bold text-gray-800"
            >
              ← Choose Different Mode
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Guest Notice — persisted dismissal via localStorage */}
      {showGuestNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between gap-4 rounded-2xl bg-amber-200 p-4 text-xs sm:text-sm text-amber-950"
          style={{ boxShadow: "4px 4px 12px rgba(28,18,6,0.3), inset -3px -3px 8px rgba(28,18,6,0.15), inset 3px 3px 8px rgba(255,215,140,0.4)" }}
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
            onClick={handleDismissGuestNotice}
            className="shrink-0 camp-btn camp-btn-white text-xs py-1 px-3 font-black"
          >
            Got It
          </button>
        </motion.div>
      )}

      {/* Board Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3 pb-3 border-b border-amber-900/20">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3.5 h-3.5 rounded-full bg-amber-300"
            style={{ boxShadow: "1px 2px 5px rgba(28,18,6,0.35), inset -1px -1px 2px rgba(28,18,6,0.2), inset 1px 1px 2px rgba(255,215,140,0.4)" }}
          />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {meta.label}
          </h1>
          <span className={`camp-badge text-[10px] hidden sm:inline-flex ${meta.badgeClass}`}>
            {meta.icon} {meta.shortLabel.toUpperCase()}
          </span>
        </div>

        <Link
          href="/modes"
          className="camp-btn camp-btn-yellow text-xs py-1.5 px-3.5 font-black"
        >
          ⇄ Change Mode
        </Link>
      </div>

      {/* Chess Game — pass mode so the board can show a persistent indicator */}
      <div className="py-2 flex justify-center">
        <CustomChessGame gameMode={mode} />
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-amber-300 text-sm font-black tracking-wider uppercase">Loading Next-Chess Board...</div>}>
      <PlayContent />
    </Suspense>
  );
}