"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, BarChart3, UserX } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Play with a Friend",
    description: "Pass-and-play on the same device — no setup, just sit down and play.",
  },
  {
    icon: Bot,
    title: "Play vs Bot",
    description: "Challenge an AI opponent with adjustable difficulty, from beginner to advanced.",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description: "See your wins, losses, draws, and full match history over time.",
  },
  {
    icon: UserX,
    title: "Play as a Guest",
    description: "No account? No problem. Jump straight into a game, no sign-up required.",
  },
];

export function Features() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl font-bold mb-12"
        >
          Everything you need to play
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <feature.icon className="w-8 h-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}