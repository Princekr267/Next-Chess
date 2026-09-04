"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const steps = [
  {
    number: "01",
    title: "Choose to sign up or play as guest",
    description: "Create an account to track your progress, or jump straight in.",
  },
  {
    number: "02",
    title: "Pick your mode",
    description: "Play locally with a friend, or challenge the bot at your skill level.",
  },
  {
    number: "03",
    title: "Play and improve",
    description: "Track your wins, losses, and match history as you play more games.",
  },
];

export function HowItWorks() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handlePlayClick = () => {
    router.push("/modes");
  };

  const buttonLabel = isPending ? "Loading..." : session ? "Play Chess" : "Play as a Guest";

  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl font-bold mb-16"
        >
          How it works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary/30 mb-3">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <motion.div className="text-center mt-8">
        <Button
          className="border-2 rounded-xl bg-sky-300 p-2 text-lg hover:bg-sky-200 cursor-pointer px-6 py-3"
          onClick={handlePlayClick}
          disabled={isPending}
        >
          {buttonLabel}
        </Button>
      </motion.div>
    </section>
  );
}