"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const modes = [
  {
    id: "bot",
    title: "vs Base Bot",
    subtitle: "Tactical AI",
    description: "Test your skills against our tactical chess engine at calibrated difficulty levels.",
    href: "/play?mode=bot",
    badge: "SOON",
    badgeClass: "camp-badge-orange",
    btnText: "Challenge Bot",
    btnClass: "camp-btn camp-btn-yellow",
    iconBg: "bg-amber-400",
    icon: (
      <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="12" x="3" y="6" rx="2" />
        <path d="M9 12h.01" />
        <path d="M15 12h.01" />
        <path d="M12 2v4" />
        <path d="m5 18-2 4" />
        <path d="m19 18 2 4" />
      </svg>
    ),
  },
  {
    id: "local",
    title: "Local Board",
    subtitle: "Pass & Play",
    description: "Two players across the carved wooden board on one screen. Perfect for friendly face-offs.",
    href: "/play?mode=local",
    badge: "READY",
    badgeClass: "camp-badge-teal",
    btnText: "Play Local",
    btnClass: "camp-btn camp-btn-ember",
    iconBg: "bg-emerald-400",
    icon: (
      <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "friend",
    title: "vs Friend",
    subtitle: "Online Duel",
    description: "Challenge a friend via private room codes with real-time clock and move sync.",
    href: "/play?mode=friend",
    badge: "SOON",
    badgeClass: "camp-badge-violet",
    btnText: "Duel Friend",
    btnClass: "camp-btn camp-btn-violet",
    iconBg: "bg-purple-400",
    icon: (
      <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function ModesPage() {
  return (
    <main className="min-h-[calc(100vh-130px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center mb-10">
        <span className="camp-badge camp-badge-yellow mb-3 shadow-[2px_2px_0px_#000000]">
          ♟ CHESS BASE MODES
        </span>
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3"
        >
          Choose How to Play
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto font-medium"
        >
          Solo training against our bot or head-to-head fireside chess with friends.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {modes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
            className="camp-card-canvas relative flex flex-col justify-between p-6 hover:-translate-y-1 transition-transform"
          >
            {mode.badge && (
              <span className={`absolute -top-3 right-4 camp-badge ${mode.badgeClass}`}>
                {mode.badge}
              </span>
            )}

            <div>
              <div className={`w-14 h-14 rounded-2xl ${mode.iconBg} border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center mb-5 mx-auto`}>
                {mode.icon}
              </div>
              <div className="text-center mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                  {mode.subtitle}
                </span>
                <h2 className="text-2xl font-black text-gray-950 mt-0.5">
                  {mode.title}
                </h2>
              </div>
              <p className="text-gray-700 text-xs sm:text-sm text-center mb-6 leading-relaxed font-medium">
                {mode.description}
              </p>
            </div>

            <Link
              href={mode.href}
              className={`w-full py-3 text-center block ${mode.btnClass} shadow-[3px_3px_0px_#000000]`}
            >
              {mode.btnText}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="text-xs font-black text-amber-300 hover:text-white transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider"
        >
          <span>←</span>
          <span>Back to Chess Base Home</span>
        </Link>
      </div>
    </main>
  );
}
