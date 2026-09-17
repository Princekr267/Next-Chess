"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const steps = [
  {
    number: "01",
    title: "Enter the Base",
    description: "Create an account to track your match ratings & history, or jump straight onto the board as a guest.",
    badge: "STEP 1",
    badgeColor: "bg-amber-300 text-black",
  },
  {
    number: "02",
    title: "Pick Your Mode",
    description: "Challenge an AI bot at calibrated difficulties, or pass & play locally with a friend on one device.",
    badge: "STEP 2",
    badgeColor: "bg-emerald-300 text-black",
  },
  {
    number: "03",
    title: "Play & Level Up",
    description: "Sharpen your tactical vision, outplay opponents, and advance your rating as you play more games.",
    badge: "STEP 3",
    badgeColor: "bg-purple-300 text-black",
  },
];

export function HowItWorks() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handlePlayClick = () => {
    router.push("/modes");
  };

  const buttonLabel = isPending ? "Checking..." : session ? "Enter Next-Chess & Play" : "Play as a Guest";

  return (
    <section className="py-20 px-4 w-full">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <span className="camp-badge camp-badge-yellow mb-3">
            ♟ WELCOME TO NEXT-CHESS
          </span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3"
          >
            How <span className="text-amber-400">Next-Chess</span> Works
          </motion.h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto font-medium">
            Jump in, challenge a bot, or sit across the board with a friend for fireside chess.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="camp-card-canvas p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 font-black flex items-center justify-center text-base tracking-wider"
                    style={{ boxShadow: "3px 3px 9px rgba(28,18,6,0.4), inset -2px -2px 5px rgba(28,18,6,0.2), inset 2px 2px 5px rgba(255,215,140,0.5)" }}
                  >
                    {step.number}
                  </span>
                  <span className={`camp-badge text-[11px] ${step.badgeColor}`}>
                    {step.badge}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-950 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-amber-900/20 flex items-center gap-1.5 text-xs font-black text-amber-800">
                <span>TACTICAL MOVE</span>
                <span className="text-amber-500 text-base">➔</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tactile CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button
            type="button"
            className="camp-btn camp-btn-yellow text-base px-8 py-3.5 font-black"
            onClick={handlePlayClick}
            disabled={isPending}
          >
            <span>{buttonLabel}</span>
            <span className="text-lg">➔</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}