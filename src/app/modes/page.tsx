"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const modes = [
  {
    id: "bot",
    title: "vs Bot",
    emoji: "🤖",
    description: "Challenge an AI computer at various difficulty levels.",
    href: "/play?mode=bot",
    badge: "Coming Soon",
    bgGradient: "from-indigo-500 to-purple-600",
    borderShadow: "shadow-[6px_6px_0px_#000]",
    btnText: "Play vs Bot",
    btnColor: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  {
    id: "local",
    title: "Local Game",
    emoji: "🏠",
    description: "Pass and play with someone on the same device.",
    href: "/play?mode=local",
    badge: "Available",
    bgGradient: "from-amber-400 to-orange-500",
    borderShadow: "shadow-[6px_6px_0px_#000]",
    btnText: "Play Local",
    btnColor: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  {
    id: "friend",
    title: "vs Friend",
    emoji: "👥",
    description: "Play against a friend online or share a room.",
    href: "/play?mode=friend",
    badge: "Coming Soon",
    bgGradient: "from-emerald-400 to-teal-600",
    borderShadow: "shadow-[6px_6px_0px_#000]",
    btnText: "Play vs Friend",
    btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
];

export default function ModesPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center mb-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-3"
        >
          Choose Game Mode
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 text-base md:text-lg max-w-xl mx-auto"
        >
          Select how you want to play chess today.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {modes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            whileHover={{ y: -6 }}
            className={`relative flex flex-col justify-between bg-white rounded-2xl border-2 border-gray-900 p-6 ${mode.borderShadow} transition-all`}
          >
            {mode.badge && (
              <span
                className={`absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-bold border border-gray-900 shadow-[2px_2px_0px_#000] ${
                  mode.badge === "Coming Soon"
                    ? "bg-amber-300 text-amber-950"
                    : "bg-emerald-300 text-emerald-950"
                }`}
              >
                {mode.badge}
              </span>
            )}

            <div>
              <div className="text-5xl mb-4 text-center">{mode.emoji}</div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {mode.title}
              </h2>
              <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
                {mode.description}
              </p>
            </div>

            <Link
              href={mode.href}
              className={`w-full py-3 rounded-xl font-bold text-center border-2 border-gray-900 shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all block ${mode.btnColor}`}
            >
              {mode.btnText}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-gray-500 hover:text-gray-800 underline underline-offset-4"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
