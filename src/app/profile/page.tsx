"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { RatingHistoryChart, RatingPoint } from "@/components/profile/RatingHistoryChart";

interface UserProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    rating: number;
    createdAt: string;
  };
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    peakRating: number;
    lowestRating: number;
    ratedGamesCount: number;
  };
  ratingHistory: RatingPoint[];
  recentMatches: Array<{
    id: number;
    opponentType: string;
    botDifficulty: string | null;
    playerColor: string;
    player2Name: string | null;
    result: string;
    ratingBefore: number | null;
    ratingAfter: number | null;
    createdAt: string;
  }>;
}

// Tactical Chess Tier based on Elo
function getChessTier(rating: number) {
  if (rating >= 1800) {
    return { name: "Grandmaster Tactician", icon: "👑", badgeColor: "camp-badge-yellow", desc: "Elite tactical command" };
  }
  if (rating >= 1600) {
    return { name: "Commander", icon: "🏰", badgeColor: "camp-badge-violet", desc: "Advanced strategist" };
  }
  if (rating >= 1400) {
    return { name: "Tactician", icon: "⚔️", badgeColor: "camp-badge-teal", desc: "Experienced club player" };
  }
  if (rating >= 1200) {
    return { name: "Knight Fighter", icon: "♟", badgeColor: "camp-badge-orange", desc: "Standard rated player" };
  }
  return { name: "Apprentice", icon: "🪵", badgeColor: "camp-badge-slate", desc: "Learning the craft" };
}

export default function ProfilePage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  // Fetch full profile and rating history from the backend
  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data: UserProfileData = await res.json();
          setProfileData(data);
          setEditName(data.user.name);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!sessionLoading) {
      fetchProfile();
    }
  }, [session, sessionLoading]);

  // Handle Display Name Update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName === profileData?.user.name) return;

    setUpdatingName(true);
    setUpdateMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const json = await res.json();

      if (res.ok) {
        setUpdateMessage({ type: "success", text: "Display name updated successfully!" });
        if (profileData) {
          setProfileData({
            ...profileData,
            user: { ...profileData.user, name: json.user.name },
          });
        }
      } else {
        setUpdateMessage({ type: "error", text: json.error || "Failed to update name." });
      }
    } catch {
      setUpdateMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setUpdatingName(false);
    }
  };

  // Mock / Trigger Email Verification
  const handleVerifyEmail = async () => {
    setVerifyStatus("sending");
    try {
      if (session?.user.email) {
        await authClient.sendVerificationEmail({
          email: session.user.email,
          callbackURL: "/profile",
        });
        setVerifyStatus("sent");
      }
    } catch {
      setVerifyStatus("error");
    }
  };

  // ── Not Signed In State ──
  if (!sessionLoading && !session) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md camp-card-canvas p-8 text-center"
        >
          <div
            className="w-16 h-16 rounded-3xl bg-amber-200 flex items-center justify-center mx-auto mb-4 text-3xl font-black"
            style={{
              boxShadow:
                "4px 4px 10px rgba(28,18,6,0.4), inset -3px -3px 7px rgba(28,18,6,0.25), inset 3px 3px 7px rgba(255,215,140,0.5)",
            }}
          >
            ♟
          </div>
          <h1 className="text-2xl font-black text-gray-950 mb-2">Tactician Profile</h1>
          <p className="text-sm text-gray-600 mb-6 font-medium">
            Sign in to inspect your Elo rating, review your historical chart, and customize your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-in" className="camp-btn camp-btn-yellow font-black text-sm py-2.5 px-6">
              Sign In
            </Link>
            <Link href="/sign-up" className="camp-btn camp-btn-white font-black text-sm py-2.5 px-6">
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Loading Skeleton State ──
  if (sessionLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center gap-4 py-20">
        <div
          className="w-14 h-14 rounded-3xl bg-amber-200 flex items-center justify-center text-3xl font-black animate-bounce"
          style={{
            boxShadow:
              "4px 4px 10px rgba(28,18,6,0.4), inset -3px -3px 7px rgba(28,18,6,0.25), inset 3px 3px 7px rgba(255,215,140,0.5)",
          }}
        >
          ♟
        </div>
        <span className="text-amber-200 text-sm font-black uppercase tracking-wider animate-pulse">
          Loading Profile & Tactical Elo…
        </span>
      </div>
    );
  }

  const user = profileData?.user ?? {
    id: session?.user.id ?? "",
    name: session?.user.name ?? "Player",
    email: session?.user.email ?? "",
    emailVerified: session?.user.emailVerified ?? false,
    image: null,
    rating: 1200,
    createdAt: new Date().toISOString(),
  };

  const stats = profileData?.stats ?? {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    peakRating: user.rating,
    lowestRating: user.rating,
    ratedGamesCount: 0,
  };

  const ratingHistory = profileData?.ratingHistory ?? [
    {
      id: 0,
      rating: user.rating,
      date: user.createdAt,
      result: "start" as const,
      opponent: "Initial Calibration",
    },
  ];

  const tier = getChessTier(user.rating);

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-[calc(100vh-130px)] px-4 py-8 max-w-5xl mx-auto w-full">
      {/* ── Page Header ── */}
      <div className="text-center mb-8">
        <span className="camp-badge camp-badge-yellow mb-2 shadow-[2px_2px_0px_#000000]">
          👤 TACTICIAN DOSSIER
        </span>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-black text-white tracking-tight"
        >
          Player Profile & Rating
        </motion.h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Live Elo calculations, battle metrics, and tactical performance history.
        </p>
      </div>

      {/* ── Profile Top Grid (Identity + Big Rating Card) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Player Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 camp-card-canvas p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Clay Avatar / Initial */}
            <div
              className="w-20 h-20 rounded-3xl bg-amber-200 flex items-center justify-center text-3xl font-black text-amber-950 shrink-0 select-none"
              style={{
                boxShadow:
                  "6px 6px 14px rgba(28,18,6,0.35), inset -4px -4px 8px rgba(28,18,6,0.2), inset 4px 4px 8px rgba(255,255,255,0.7)",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* User Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-gray-950 tracking-tight truncate">
                  {user.name}
                </h2>
                <span className={`camp-badge ${tier.badgeColor} text-[11px]`}>
                  {tier.icon} {tier.name}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-semibold truncate mb-2">
                {user.email}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1">
                  📅 Member since {memberSince}
                </span>
                <span>•</span>
                {user.emailVerified ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-amber-800 font-extrabold flex items-center gap-1">
                    ⚠️ Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Edit Display Name */}
          <div className="mt-6 pt-5 border-t border-amber-900/10">
            <form onSubmit={handleUpdateName} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Change display name"
                  maxLength={50}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/90 text-gray-900 font-bold placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                  style={{
                    boxShadow: "inset 2px 2px 6px rgba(28,18,6,0.18), inset -2px -2px 6px rgba(255,220,160,0.5)",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={updatingName || editName.trim() === user.name}
                className="camp-btn camp-btn-yellow text-xs py-2.5 px-5 font-black shrink-0 disabled:opacity-50"
              >
                {updatingName ? "Saving…" : "Update Name"}
              </button>
            </form>

            <AnimatePresence>
              {updateMessage && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-xs font-bold mt-2 ${
                    updateMessage.type === "success" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {updateMessage.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right: Big Tactical Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="camp-card-dark p-6 sm:p-8 flex flex-col justify-between text-center relative overflow-hidden"
        >
          <div className="absolute top-3 right-3 opacity-15 text-6xl font-black select-none pointer-events-none">
            ♟
          </div>

          <div>
            <span className="camp-badge camp-badge-yellow mb-2 text-[10px]">
              CURRENT ELO RATING
            </span>
            <div className="my-2">
              <span className="text-5xl sm:text-6xl font-black text-amber-200 tracking-tight drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
                {user.rating}
              </span>
            </div>
            <p className="text-xs text-amber-100/70 font-semibold">
              {tier.desc}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-900/30 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-black/20 border border-amber-900/20">
              <span className="text-[11px] text-slate-400 block font-medium">Peak Elo</span>
              <strong className="text-amber-300 font-black text-sm">{stats.peakRating}</strong>
            </div>
            <div className="p-2 rounded-xl bg-black/20 border border-amber-900/20">
              <span className="text-[11px] text-slate-400 block font-medium">Rated Games</span>
              <strong className="text-white font-black text-sm">{stats.ratedGamesCount}</strong>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Stats Summary Row (4 mini clay cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="camp-card-canvas p-4 text-center">
          <span className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">
            Total Matches
          </span>
          <span className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats.totalGames}
          </span>
        </div>

        <div className="camp-card-canvas p-4 text-center">
          <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block mb-1">
            Victories 🏆
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700">
            {stats.wins}
          </span>
        </div>

        <div className="camp-card-canvas p-4 text-center">
          <span className="text-xs font-black text-rose-800 uppercase tracking-wider block mb-1">
            Defeats 💀
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-700">
            {stats.losses}
          </span>
        </div>

        <div className="camp-card-canvas p-4 text-center">
          <span className="text-xs font-black text-amber-800 uppercase tracking-wider block mb-1">
            Win Rate
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-700">
            {stats.winRate}%
          </span>
        </div>
      </div>

      {/* ── Rating History Chart Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="camp-card-dark p-6 sm:p-8 mb-8"
      >
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              📈 Elo Progression Chart
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual track of your rating curve over completed local and rated matches.
            </p>
          </div>

          <Link
            href="/modes"
            className="camp-btn camp-btn-yellow text-xs py-2 px-4 font-black self-start sm:self-auto"
          >
            Play Rated Match ♟
          </Link>
        </div>

        {/* The SVG Line Chart */}
        <RatingHistoryChart
          data={ratingHistory}
          currentRating={user.rating}
          peakRating={stats.peakRating}
        />
      </motion.section>

      {/* ── Recent Matches & Account Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Matches (2 cols) */}
        <div className="lg:col-span-2 camp-card-canvas p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-900/10">
            <h3 className="text-lg font-black text-gray-950 flex items-center gap-2">
              ⚔️ Recent Encounters
            </h3>
            <Link
              href="/history"
              className="text-xs font-extrabold text-amber-900 hover:text-amber-700 transition-colors"
            >
              View Full History →
            </Link>
          </div>

          {profileData?.recentMatches && profileData.recentMatches.length > 0 ? (
            <div className="space-y-2.5">
              {profileData.recentMatches.map((m) => {
                const delta =
                  m.ratingAfter !== null && m.ratingBefore !== null
                    ? m.ratingAfter - m.ratingBefore
                    : null;
                const isWin = m.result === "win";
                const isLoss = m.result === "loss";

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/70 hover:bg-white/90 transition-colors"
                    style={{
                      boxShadow: "2px 2px 6px rgba(28,18,6,0.1), inset 1px 1px 2px rgba(255,255,255,0.7)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                          isWin
                            ? "bg-emerald-200 text-emerald-900"
                            : isLoss
                            ? "bg-rose-200 text-rose-900"
                            : "bg-amber-200 text-amber-900"
                        }`}
                      >
                        {isWin ? "🏆" : isLoss ? "💀" : "🤝"}
                      </span>
                      <div>
                        <span className="text-xs font-black text-gray-900 block">
                          {m.opponentType === "local"
                            ? `vs ${m.player2Name || "Local Player"}`
                            : `vs Tactical Bot (${m.botDifficulty || "Normal"})`}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Playing as {m.playerColor}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {m.ratingAfter !== null ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-black text-gray-900">{m.ratingAfter}</span>
                          {delta !== null && (
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                delta >= 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {delta >= 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-bold">Unrated</span>
                      )}
                      <span className="text-[10px] text-gray-400 block font-medium">
                        {new Date(m.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-xs font-bold">
              No matches recorded yet. Play a game from{" "}
              <Link href="/modes" className="text-amber-800 underline">
                Play Modes
              </Link>
              !
            </div>
          )}
        </div>

        {/* Security & Email Verification (1 col) */}
        <div className="camp-card-canvas p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-950 mb-3 flex items-center gap-2">
              🛡️ Account Security
            </h3>
            <p className="text-xs text-gray-600 font-medium mb-4">
              Keep your credentials verified for tactical ranking leaderboards and account recovery.
            </p>

            <div className="p-3.5 rounded-2xl bg-white/70 mb-4"
              style={{ boxShadow: "inset 2px 2px 5px rgba(28,18,6,0.1)" }}
            >
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Email Status
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-900 truncate max-w-[140px]">
                  {user.email}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    user.emailVerified
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {user.emailVerified ? "Verified ✓" : "Unverified ⚠️"}
                </span>
              </div>
            </div>

            {!user.emailVerified && (
              <div>
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={verifyStatus === "sending" || verifyStatus === "sent"}
                  className="w-full camp-btn camp-btn-yellow text-xs py-2 font-black"
                >
                  {verifyStatus === "sending"
                    ? "Sending Link…"
                    : verifyStatus === "sent"
                    ? "Verification Sent!"
                    : "Send Verification Email"}
                </button>
                {verifyStatus === "sent" && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1.5 text-center">
                    Check your inbox for the confirmation link.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-amber-900/10 text-center">
            <span className="text-[11px] text-gray-500 font-semibold block">
              Logged in as <strong className="text-gray-900">{user.name}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}