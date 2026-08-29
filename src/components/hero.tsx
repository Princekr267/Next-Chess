"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-black/[0.96] antialiased">
      <Spotlight />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-6xl"
        >
          Play Chess. Track Every Move.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg text-neutral-300"
        >
          Play instantly against a friend or the computer. Sign in to track
          your wins, losses, and progress over time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex justify-center gap-4"
        >
          <Link href="/play">
            <Button size="lg">Play Now</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline">
              Sign Up Free
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}