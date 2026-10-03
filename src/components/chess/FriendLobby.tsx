"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Swords,
  Clock,
  Copy,
  Check,
  Share2,
  Users,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface FriendLobbyProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      rating?: number;
    };
  } | null;
  onRoomReady: (room: any, role: "host" | "guest", color: "white" | "black") => void;
}

const TIME_CONTROLS = [
  { label: "Casual", totalSec: 0, incSec: 0, desc: "No clock" },
  { label: "1 min", totalSec: 60, incSec: 0, desc: "Bullet" },
  { label: "3 min", totalSec: 180, incSec: 2, desc: "3 | 2 Blitz" },
  { label: "5 min", totalSec: 300, incSec: 0, desc: "5 | 0 Blitz" },
  { label: "10 min", totalSec: 600, incSec: 5, desc: "10 | 5 Rapid" },
];

export function FriendLobby({ session, onRoomReady }: FriendLobbyProps) {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Create Room state
  const [selectedTimeControl, setSelectedTimeControl] = useState(3); // default 5 min
  const [hostColor, setHostColor] = useState<"white" | "black" | "random">("white");
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Join Room state
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Handle Create Room
  async function handleCreateRoom() {
    if (!session) return;
    setIsCreating(true);
    setCreateError(null);

    const tc = TIME_CONTROLS[selectedTimeControl];

    try {
      const { data } = await axios.post("/api/rooms", {
        timeControl: tc.totalSec,
        increment: tc.incSec,
        hostColor,
      });

      setCreatedRoom(data.room);
      // Wait for guest in parent or start Pusher subscription
      onRoomReady(data.room, "host", hostColor === "random" ? "white" : hostColor);
    } catch (err: any) {
      setCreateError(err.response?.data?.error ?? "Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  // Handle Join Room
  async function handleJoinRoom(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!session || !joinCode.trim()) return;

    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setJoinError("Room code must be 6 characters.");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const { data } = await axios.post(`/api/rooms/${cleanCode}/join`);
      onRoomReady(data.room, data.myRole, data.myColor);
    } catch (err: any) {
      setJoinError(err.response?.data?.error ?? "Failed to join room. Check code and try again.");
    } finally {
      setIsJoining(false);
    }
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyLink(code: string) {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/play?mode=friend&room=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="camp-card-canvas max-w-md w-full p-8 text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl bg-amber-200 flex items-center justify-center mx-auto mb-4"
            style={{
              boxShadow:
                "4px 4px 10px rgba(28,18,6,0.4), inset -3px -3px 7px rgba(28,18,6,0.25), inset 3px 3px 7px rgba(255,215,140,0.5)",
            }}
          >
            <ShieldAlert className="w-8 h-8 text-amber-950" />
          </div>

          <span className="camp-badge camp-badge-violet mb-3">
            AUTHENTICATION REQUIRED
          </span>

          <h2 className="text-2xl font-black text-gray-950 mb-2">
            Online Duel Lobbies
          </h2>
          <p className="text-gray-700 text-xs sm:text-sm mb-6 leading-relaxed font-medium">
            To challenge friends over real-time private rooms and track live rating changes, please sign in to your Next-Chess account.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/sign-in"
              className="camp-btn camp-btn-ember w-full py-3 text-sm font-black flex items-center justify-center gap-2"
            >
              Sign In to Continue <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/play?mode=local"
              className="camp-btn camp-btn-white w-full py-2.5 text-xs font-bold text-gray-800"
            >
              Play Local Pass & Play Instead
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      <div className="camp-card-canvas p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-950/15">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl bg-purple-400 flex items-center justify-center text-black"
              style={{
                boxShadow:
                  "3px 3px 8px rgba(28,18,6,0.35), inset -2px -2px 5px rgba(28,18,6,0.2), inset 2px 2px 5px rgba(255,215,140,0.4)",
              }}
            >
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                Friend Duel Lobby
              </h2>
              <p className="text-xs font-bold text-amber-900/80">
                Playing as <span className="text-black font-black">{session.user.name}</span>
                {session.user.rating && (
                  <span className="ml-2 camp-badge camp-badge-yellow text-[10px] py-0 px-2">
                    {session.user.rating} ELO
                  </span>
                )}
              </p>
            </div>
          </div>

          <span className="camp-badge camp-badge-teal text-[11px] hidden sm:inline-flex">
            STABLE REAL-TIME
          </span>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-amber-950/10 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all ${
              activeTab === "create"
                ? "bg-amber-300 text-amber-950 shadow-[2px_2px_0px_#000]"
                : "text-amber-950/70 hover:text-amber-950"
            }`}
          >
            Create New Room
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={`py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all ${
              activeTab === "join"
                ? "bg-amber-300 text-amber-950 shadow-[2px_2px_0px_#000]"
                : "text-amber-950/70 hover:text-amber-950"
            }`}
          >
            Join with Code
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "create" ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Time Controls */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-950/80 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time Control
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_CONTROLS.map((tc, idx) => (
                    <button
                      key={tc.label}
                      type="button"
                      onClick={() => setSelectedTimeControl(idx)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTimeControl === idx
                          ? "bg-amber-100 border-amber-900 shadow-[2px_2px_0px_#000] scale-[1.02]"
                          : "bg-white/60 border-amber-950/20 hover:bg-white text-gray-800"
                      }`}
                    >
                      <div className="font-black text-sm text-gray-950">{tc.label}</div>
                      <div className="text-[11px] font-bold text-amber-900/70">{tc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side / Color Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-amber-950/80 mb-2">
                  Your Color Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setHostColor("white")}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      hostColor === "white"
                        ? "bg-white border-amber-900 shadow-[2px_2px_0px_#000] ring-2 ring-amber-600"
                        : "bg-white/40 border-amber-950/20 hover:bg-white/70"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-400 shadow-sm" />
                    <span className="text-xs font-black text-gray-950">White</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostColor("random")}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      hostColor === "random"
                        ? "bg-amber-200 border-amber-900 shadow-[2px_2px_0px_#000] ring-2 ring-amber-600"
                        : "bg-white/40 border-amber-950/20 hover:bg-white/70"
                    }`}
                  >
                    <span className="text-base leading-none">🎲</span>
                    <span className="text-xs font-black text-gray-950">Random</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostColor("black")}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      hostColor === "black"
                        ? "bg-slate-900 text-white border-black shadow-[2px_2px_0px_#000] ring-2 ring-amber-600"
                        : "bg-white/40 border-amber-950/20 hover:bg-white/70"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 shadow-sm" />
                    <span className={`text-xs font-black ${hostColor === "black" ? "text-white" : "text-gray-950"}`}>
                      Black
                    </span>
                  </button>
                </div>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold">
                  {createError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="camp-btn camp-btn-ember w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating Room...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Create Private Room
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label
                    htmlFor="roomCodeInput"
                    className="block text-xs font-black uppercase tracking-wider text-amber-950/80 mb-2"
                  >
                    Enter 6-Character Room Code
                  </label>
                  <input
                    id="roomCodeInput"
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    placeholder="e.g. 7X8K2M"
                    className="w-full text-center tracking-[0.35em] text-2xl font-mono font-black py-3.5 px-4 rounded-xl border-2 border-amber-950/30 bg-white focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-500/20 text-gray-950"
                  />
                  <p className="text-[11px] font-bold text-amber-900/70 mt-1.5 text-center">
                    Ask your friend for their room code or click the direct invite link.
                  </p>
                </div>

                {joinError && (
                  <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold text-center">
                    {joinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining || joinCode.trim().length !== 6}
                  className="camp-btn camp-btn-violet w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Entering Arena...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" /> Join Game
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
