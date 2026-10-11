"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import {
  RotateCcw,
  ArrowRight,
  Play,
  ChevronDown,
} from "lucide-react";

export function TacticianHero() {
  const { data: session } = authClient.useSession();
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);

  return (
    <section className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-2 sm:py-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* ── AMBIENT CANDLELIGHT GLOW ────────────────────────────────────────── */}
      <div
        className="absolute top-6 w-[300px] sm:w-[550px] lg:w-[750px] h-[300px] sm:h-[450px] lg:h-[600px] rounded-full pointer-events-none blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245, 228, 176, 0.35) 0%, rgba(245, 197, 160, 0.15) 50%, transparent 70%)",
        }}
      />

      {/* ── 1. HERO HEADER: CLEAN, PUNCHY COPY (REMOVED REDUNDANT BUTTONS) ── */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 relative z-10">
        
        {/* Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#50402a] text-[#f5e4b0] text-[10px] sm:text-[11px] font-black tracking-wider uppercase border border-[#6b5234]/50 shadow-[4px_6px_12px_rgba(35,24,12,0.4),inset_1px_1px_2px_rgba(253,248,240,0.3)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          <span>♟ NEXT-CHESS • ARTISANAL CLAY ARENA</span>
          {session?.user && (
            <span className="hidden sm:inline-block border-l border-amber-900/40 pl-1.5 text-amber-200/90 font-bold lowercase">
              @{session.user.name || "player"}
            </span>
          )}
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-2xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#fdf3e3] leading-[1.12] drop-shadow-sm max-w-2xl"
        >
          Tactical Depth. Zero Clutter.{" "}
          <span className="text-[#f5e4b0] underline decoration-[#b84e10]/40 decoration-wavy underline-offset-4">
            100% Tactile.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-xs sm:text-sm text-[#d8c5aa] max-w-xl font-medium leading-snug px-2"
        >
          Fireside bot sparring, couch pass-and-play, and artisanal carved pieces in pure browser 3D.
          Play instantly as a guest or duel friends with private room codes.
        </motion.p>

      </div>

      {/* ── 2. THE GRAND 3D CLAY WORKSTATION (RESTORED TO FULL RICH SIZE) ──── */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 z-10">
        
        {/* ── A) LEFT BENEFIT CARD: BOT SPARRING HIGHLIGHT ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full max-w-[280px] lg:w-68 bg-[#50402a] rounded-2xl p-4 sm:p-4.5 border border-[#6b5234]/40 flex flex-col justify-between gap-3.5 shadow-[10px_16px_28px_rgba(25,15,6,0.48),-2px_-2px_10px_rgba(92,74,48,0.22),inset_1.5px_1.5px_3px_rgba(253,248,240,0.3)] order-2 lg:order-1"
        >
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-400/90 text-amber-950 flex items-center justify-center font-bold text-lg shadow-sm">
                🤖
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/50 text-[9px] font-black uppercase tracking-wider">
                CALIBRATED
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#fdf3e3] mb-1">
              Calibrated AI Bots
            </h3>
            <p className="text-xs text-[#d8c5aa] leading-relaxed">
              From 800 casual warmups to 2800 GM depth. Instant moves with local WASM calculation and zero lag.
            </p>
          </div>

          <Link
            href="/play?mode=bot"
            className="w-full py-2 px-3.5 rounded-xl bg-[#43341e] hover:bg-[#5c4a30] text-[#f5e4b0] text-xs font-black flex items-center justify-between border border-[#6b5234]/40 transition-colors shadow-sm"
          >
            <span>Spar vs Bot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* ── B) CENTER STAGE: 3D CLAY CHESSBOARD (FULL MAJESTIC SIZE) ──────── */}
        <div className="relative flex flex-col items-center order-1 lg:order-2 w-full max-w-[360px] sm:max-w-[430px] md:max-w-[480px] lg:max-w-[500px]">
          
          {/* Perspective 3D Board Frame */}
          <div className="perspective-board w-full flex justify-center p-0.5 sm:p-1">
            <div className="board-angle relative w-[330px] sm:w-[410px] md:w-[460px] lg:w-[480px] aspect-square bg-[#3a2211] rounded-2xl sm:rounded-3xl p-3 sm:p-5 border-4 sm:border-[6px] border-[#5c4a30] shadow-[16px_24px_40px_rgba(20,12,4,0.75),inset_3px_3px_6px_rgba(253,248,240,0.25),inset_-4px_-4px_8px_rgba(20,10,3,0.6)]">
              
              {/* Candlelight Sheen Reflection */}
              <div className="absolute inset-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-transparent via-[#f5e4b0]/8 to-transparent pointer-events-none z-30" />

              {/* Ranks 8-1 on the left edge */}
              <div className="absolute left-1 sm:left-1.5 top-3.5 bottom-3.5 flex flex-col justify-around text-[9px] sm:text-[11px] font-black text-[#f5e4b0]/40 select-none">
                {(boardFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map((rank) => (
                  <span key={rank}>{rank}</span>
                ))}
              </div>

              {/* Files a-h on the bottom edge */}
              <div className="absolute bottom-1 left-4 right-4 flex justify-around text-[9px] sm:text-[11px] font-black text-[#f5e4b0]/40 select-none">
                {(boardFlipped ? ["h", "g", "f", "e", "d", "c", "b", "a"] : ["a", "b", "c", "d", "e", "f", "g", "h"]).map((file) => (
                  <span key={file}>{file}</span>
                ))}
              </div>

              {/* 8x8 Sculpted Ceramic Chess Grid */}
              <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg sm:rounded-xl overflow-hidden border border-[#261509] shadow-inner bg-[#261509]">
                
                {/* ── ROW 8 (Black Pieces Backline) ── */}
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♜</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♞</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♝</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♛</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♚</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♝</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♞</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♜</span></div>

                {/* ── ROW 7 (Black Pawns) ── */}
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] filter drop-shadow select-none">♟</span></div>

                {/* ── ROWS 6-3 (Open Board Squares) ── */}
                <div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div>
                <div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div>
                <div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div>
                <div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div><div className="bg-[#4a2f1c]"></div><div className="bg-[#f5e4b0] shadow-inner"></div>

                {/* ── ROW 2 (White Pawns) ── */}
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♙</span></div>

                {/* ── ROW 1 (White Backline) ── */}
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♖</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♘</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♗</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♕</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♔</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♗</span></div>
                <div className="bg-[#4a2f1c] flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♘</span></div>
                <div className="bg-[#f5e4b0] shadow-inner flex items-center justify-center"><span className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] text-amber-100 filter drop-shadow select-none">♖</span></div>

              </div>
            </div>
          </div>

          {/* Clean Action Ribbon Under Board */}
          <div className="mt-2.5 w-full max-w-[300px] sm:max-w-[340px] md:max-w-[360px] bg-[#50402a] rounded-full px-4 py-1.5 flex items-center justify-between border border-[#6b5234]/50 shadow-[6px_10px_20px_rgba(25,15,6,0.45),inset_1.5px_1.5px_3px_rgba(253,248,240,0.25)]">
            <button
              onClick={() => setBoardFlipped(!boardFlipped)}
              className="px-3.5 py-1 rounded-full bg-[#43341e] text-[#d8c5aa] hover:text-[#fdf3e3] text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all"
              title="Flip Board View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Flip Board</span>
            </button>

            <Link
              href="/play?mode=local"
              className="px-4 py-1 rounded-full bg-[#f5e4b0] text-[#5c3800] text-xs font-black flex items-center gap-1.5 shadow hover:brightness-105 active:scale-95 transition-all"
              title="Launch Live Board"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Board</span>
            </Link>
          </div>

        </div>

        {/* ── C) RIGHT BENEFIT CARD: PASS & PLAY & FRIEND DUEL HIGHLIGHT ───── */}
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full max-w-[280px] lg:w-72 bg-[#50402a] rounded-2xl p-4 sm:p-5 border border-[#6b5234]/40 flex flex-col justify-between gap-3.5 shadow-[10px_16px_28px_rgba(25,15,6,0.48),-2px_-2px_10px_rgba(92,74,48,0.22),inset_1.5px_1.5px_3px_rgba(253,248,240,0.3)] order-3"
        >
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-9 h-9 rounded-xl bg-purple-400/90 text-purple-950 flex items-center justify-center font-bold text-lg shadow-sm">
                ⚔️
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/50 text-[9px] font-black uppercase tracking-wider">
                MULTIPLAYER
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#fdf3e3] mb-1">
              Local & Online Duels
            </h3>
            <p className="text-xs text-[#d8c5aa] leading-relaxed">
              Sit across one device for couch chess, or create a 6-digit room code with real-time live sync.
            </p>
          </div>

          <Link
            href="/play?mode=friend"
            className="w-full py-2 px-3.5 rounded-xl bg-[#43341e] hover:bg-[#5c4a30] text-[#f5e4b0] text-xs font-black flex items-center justify-between border border-[#6b5234]/40 transition-colors shadow-sm"
          >
            <span>Duel a Friend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

      </div>

      {/* Subtle Scroll Hint */}
      <div className="mt-5 sm:mt-7 flex flex-col items-center gap-0.5 text-[#b89a72] text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
        <span>Explore Match Arenas</span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
      </div>

      {/* ── 3. DEFINITIVE MATCH MODES SELECTION (BELOW THE FOLD SECTION) ─────── */}
      <div className="w-full max-w-5xl mx-auto pt-10 sm:pt-14 mt-6 border-t border-[#6b5234]/30 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <span className="camp-badge camp-badge-yellow mb-2 text-[10px]">
            ♟ HOW DO YOU WANT TO PLAY?
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-[#fdf3e3] tracking-tight">
            Choose Your Match Arena
          </h2>
          <p className="text-xs sm:text-sm text-[#b89a72] mt-1 max-w-md mx-auto font-medium">
            Solo training against calibrated AI or head-to-head fireside chess with friends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Card 1: Bot Sparring */}
          <motion.div
            whileHover={{ translateY: -3 }}
            className="camp-card-canvas p-4 sm:p-5 flex flex-col justify-between gap-3 border border-amber-900/10 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-9 h-9 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center font-black text-base shadow-sm">
                  🤖
                </span>
                <span className="camp-badge camp-badge-orange text-[9px]">
                  CALIBRATED AI
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 mb-1">
                vs Base Bot
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                Adjustable 800–2800 ELO tactical engine with local WASM calculation and zero lag.
              </p>
            </div>

            <Link
              href="/play?mode=bot"
              className="camp-btn camp-btn-yellow text-xs py-2 w-full flex items-center justify-center gap-1.5 font-black mt-2"
            >
              <span>Challenge Bot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Card 2: Local Pass & Play */}
          <motion.div
            whileHover={{ translateY: -3 }}
            className="camp-card-canvas p-4 sm:p-5 flex flex-col justify-between gap-3 border border-amber-900/10 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-9 h-9 rounded-2xl bg-emerald-300 text-emerald-950 flex items-center justify-center font-black text-base shadow-sm">
                  🏠
                </span>
                <span className="camp-badge camp-badge-teal text-[9px]">
                  ONE SCREEN
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 mb-1">
                Local Pass & Play
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                Two players across the carved wooden board on one device. Clean digital clock plungers.
              </p>
            </div>

            <Link
              href="/play?mode=local"
              className="camp-btn camp-btn-ember text-xs py-2 w-full flex items-center justify-center gap-1.5 font-black mt-2"
            >
              <span>Play Local Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Card 3: Friend Duel */}
          <motion.div
            whileHover={{ translateY: -3 }}
            className="camp-card-canvas p-4 sm:p-5 flex flex-col justify-between gap-3 border border-amber-900/10 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-9 h-9 rounded-2xl bg-purple-300 text-purple-950 flex items-center justify-center font-black text-base shadow-sm">
                  ⚔️
                </span>
                <span className="camp-badge camp-badge-violet text-[9px]">
                  ONLINE DUEL
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 mb-1">
                Friend Duel
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                Private 6-digit room codes with real-time Pusher sync, rating tracking, and clocks.
              </p>
            </div>

            <Link
              href="/play?mode=friend"
              className="camp-btn camp-btn-violet text-xs py-2 w-full flex items-center justify-center gap-1.5 font-black mt-2"
            >
              <span>Duel Friend</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

        </div>

        {/* Subtle History Link Footer */}
        <div className="flex justify-center items-center gap-2 mt-6 text-xs text-[#b89a72] font-semibold">
          <span>Want to review previous games?</span>
          <Link
            href="/history"
            className="text-[#f5e4b0] hover:underline font-bold inline-flex items-center gap-1"
          >
            <span>Match History</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

    </section>
  );
}
