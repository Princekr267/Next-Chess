"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";

interface Match {
  id: number;
  opponentType: "local" | "bot";
  botDifficulty: string | null;
  playerColor: "white" | "black";
  player2Name: string | null;
  result: "win" | "loss" | "draw";
  ratingBefore: number | null;
  ratingAfter: number | null;
  createdAt: string;
}

function ResultBadge({ result }: { result: Match["result"] }) {
  const map = {
    win: { label: "Victory", cls: "bg-emerald-400 text-emerald-950 border-emerald-700", icon: "🏆" },
    loss: { label: "Defeat", cls: "bg-rose-500 text-white border-rose-800", icon: "💀" },
    draw: { label: "Draw", cls: "bg-amber-400 text-black border-amber-700", icon: "🤝" },
  } as const;
  const { label, cls, icon } = map[result];
  return (
    <span className={`camp-badge ${cls} text-[11px] px-3 py-1 shadow-[2px_2px_0px_#000000]`}>
      {icon} {label}
    </span>
  );
}

function ColorPip({ color }: { color: Match["playerColor"] }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
      <span
        className={`w-4 h-4 rounded-full ${
          color === "white" ? "bg-amber-200" : "bg-slate-700"
        }`}
        style={{ boxShadow: "1px 2px 4px rgba(28,18,6,0.3), inset -1px -1px 2px rgba(28,18,6,0.2), inset 1px 1px 2px rgba(255,215,140,0.35)" }}
      />
      {color === "white" ? "White" : "Black"}
    </span>
  );
}

function RatingDelta({ before, after }: { before: number; after: number }) {
  const delta = after - before;
  const positive = delta >= 0;
  return (
    <div className="flex items-center gap-1.5 text-xs font-black">
      <span className="text-slate-400">{before}</span>
      <span className="text-slate-600">→</span>
      <span className={positive ? "text-emerald-400" : "text-rose-400"}>{after}</span>
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full border font-black ${
          positive
            ? "bg-emerald-900/60 border-emerald-700 text-emerald-400"
            : "bg-rose-900/60 border-rose-700 text-rose-400"
        }`}
      >
        {positive ? "+" : ""}
        {delta}
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getHistory() {
      try {
        const { data } = await axios.get("/api/matches");
        setMatches(data.matches ?? []);
      } catch (err: unknown) {
        const status =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { status?: number } }).response?.status === "number"
            ? (err as { response: { status: number } }).response.status
            : null;
        if (status === 401) {
          setError("not-signed-in");
        } else {
          setError("failed");
        }
      } finally {
        setLoading(false);
      }
    }
    getHistory();
  }, []);

  // ---- Derived stats ----
  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.filter((m) => m.result === "loss").length;
  const draws = matches.filter((m) => m.result === "draw").length;
  const total = matches.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const latestRating =
    matches[0]?.ratingAfter ?? matches[0]?.ratingBefore ?? null;

  return (
    <main className="min-h-[calc(100vh-130px)] px-4 py-10 max-w-4xl mx-auto w-full">

      {/* ── Page Header ── */}
      <div className="mb-8 text-center">
        <span className="camp-badge camp-badge-yellow mb-3 shadow-[2px_2px_0px_#000000]">
          📜 MATCH RECORDS
        </span>
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2"
        >
          Your Battle History
        </motion.h1>
        <p className="text-slate-400 text-sm mt-1.5 font-medium">
          Every game recorded, every rating point tracked.
        </p>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-200 flex items-center justify-center text-2xl animate-bounce"
            style={{ boxShadow: "4px 4px 10px rgba(28,18,6,0.4), inset -3px -3px 7px rgba(28,18,6,0.25), inset 3px 3px 7px rgba(255,215,140,0.5)" }}
          >
            ♟
          </div>
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider animate-pulse">
            Loading matches…
          </span>
        </div>
      )}

      {/* ── Not signed in ── */}
      {!loading && error === "not-signed-in" && (
        <div className="camp-card-canvas p-8 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Sign In to View History</h2>
          <p className="text-gray-600 text-sm mb-5 font-medium">
            Your match history is private. Sign in to access your records.
          </p>
          <Link href="/sign-in" className="camp-btn camp-btn-yellow text-sm py-2 px-6 font-black shadow-[3px_3px_0px_#000]">
            Sign In
          </Link>
        </div>
      )}

      {/* ── Generic error ── */}
      {!loading && error === "failed" && (
        <div className="camp-card-canvas p-8 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Failed to Load</h2>
          <p className="text-gray-600 text-sm font-medium">
            Couldn't fetch your match history. Try refreshing the page.
          </p>
        </div>
      )}

      {/* ── Loaded ── */}
      {!loading && !error && (
        <>
          {/* Stats Bar */}
          {total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
            >
              {[
                { label: "Matches", value: total, cls: "text-white" },
                { label: "Wins", value: wins, cls: "text-emerald-400" },
                { label: "Losses", value: losses, cls: "text-rose-400" },
                { label: "Win Rate", value: `${winRate}%`, cls: "text-amber-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="camp-card-dark rounded-2xl px-4 py-3 text-center"
                >
                  <div className={`text-2xl font-black ${stat.cls}`}>{stat.value}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Current Rating */}
          {latestRating != null && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl bg-amber-950/40"
              style={{ boxShadow: "4px 4px 12px rgba(28,18,6,0.45), inset -3px -3px 8px rgba(28,18,6,0.3), inset 3px 3px 8px rgba(255,210,130,0.08)" }}
            >
              <span className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-amber-900 font-black text-sm shrink-0"
                style={{ boxShadow: "3px 3px 8px rgba(28,18,6,0.4), inset -2px -2px 5px rgba(28,18,6,0.25), inset 2px 2px 5px rgba(255,215,140,0.5)" }}
              >
                ⭐
              </span>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Current Elo Rating
                </div>
                <div className="text-xl font-black text-amber-300">{latestRating}</div>
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {matches.length === 0 && (
            <div className="camp-card-canvas p-10 text-center max-w-md mx-auto">
              <div className="text-5xl mb-4">♟</div>
              <h2 className="text-xl font-black text-gray-900 mb-2">No Matches Yet</h2>
              <p className="text-gray-600 text-sm mb-5 font-medium leading-relaxed">
                Play your first game to start building your match record.
              </p>
              <Link
                href="/modes"
                className="camp-btn camp-btn-ember text-sm py-2 px-6 font-black shadow-[3px_3px_0px_#000]"
              >
                Play Now →
              </Link>
            </div>
          )}

          {/* Match List */}
          {matches.length > 0 && (
            <div className="flex flex-col gap-3">
              {matches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-transform hover:-translate-y-0.5 ${
                    match.result === "win"
                      ? "bg-emerald-950/40"
                      : match.result === "loss"
                      ? "bg-rose-950/40"
                      : "bg-slate-800/60"
                  }`}
                  style={{ boxShadow: "4px 4px 12px rgba(28,18,6,0.45), inset -3px -3px 8px rgba(28,18,6,0.3), inset 3px 3px 8px rgba(255,210,130,0.06)" }}
                >
                  {/* Left: result + opponent */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Result icon */}
                    <div
                      className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl ${
                        match.result === "win"
                          ? "bg-emerald-400"
                          : match.result === "loss"
                          ? "bg-rose-500"
                          : "bg-amber-300"
                      }`}
                      style={{ boxShadow: "3px 3px 8px rgba(28,18,6,0.4), inset -2px -2px 5px rgba(28,18,6,0.25), inset 2px 2px 5px rgba(255,215,140,0.4)" }}
                    >
                      {match.result === "win" ? "🏆" : match.result === "loss" ? "💀" : "🤝"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ResultBadge result={match.result} />
                        {match.opponentType === "bot" && (
                          <span className="camp-badge camp-badge-orange text-[10px] px-2">
                            🤖 Bot{match.botDifficulty ? ` · ${match.botDifficulty}` : ""}
                          </span>
                        )}
                        {match.opponentType === "local" && (
                          <span className="camp-badge camp-badge-teal text-[10px] px-2">
                            🏠 Local
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <ColorPip color={match.playerColor} />
                        {match.player2Name && (
                          <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">
                            vs {match.player2Name}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-medium">
                          {formatDate(match.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rating change */}
                  <div className="sm:text-right shrink-0">
                    {match.ratingBefore != null && match.ratingAfter != null ? (
                      <RatingDelta before={match.ratingBefore} after={match.ratingAfter} />
                    ) : (
                      <span className="text-[10px] text-slate-600 font-medium italic">
                        Unrated
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Footer CTA */}
          {matches.length > 0 && (
            <div className="mt-10 text-center">
              <Link
                href="/modes"
                className="text-xs font-black text-amber-300 hover:text-white transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider"
              >
                <span>♟</span>
                <span>Play Another Match</span>
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}