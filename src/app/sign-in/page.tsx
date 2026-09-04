"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Invalid email or password. Please try again.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-md bg-[#fffdfa] border-[3px] border-black shadow-[8px_8px_0px_#000000] rounded-2xl p-7 sm:p-9 text-[#0f172a] relative"
      >
        {/* Playful Floating Badge */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
          <span className="camp-badge camp-badge-yellow shadow-[3px_3px_0px_#000000] text-xs px-4 py-1">
            ♟ BASE ACCESS
          </span>
        </div>

        {/* Header */}
        <div className="text-center mt-2 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center mx-auto mb-3 text-2xl font-black">
            👑
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950">
            Welcome to Chess Base
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">
            Sign in to track your tactical match ratings & history
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl border-2 border-red-500 bg-red-100/90 text-red-900 text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#ef4444]"
          >
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-extrabold uppercase tracking-wider text-gray-800 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="tactician@chessbase.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-gray-900 font-semibold placeholder:text-gray-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/50 shadow-[2px_2px_0px_#000000] transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-extrabold uppercase tracking-wider text-gray-800"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-gray-900 font-semibold placeholder:text-gray-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/50 shadow-[2px_2px_0px_#000000] transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 font-bold text-xs p-1"
                tabIndex={-1}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="camp-btn camp-btn-yellow w-full py-3.5 mt-2 text-base font-black tracking-wide flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Entering Base...</span>
            ) : (
              <>
                <span>Sign In to Base</span>
                <span className="text-lg">➔</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200" />
          </div>
          <span className="relative bg-[#fffdfa] px-3 text-[11px] font-black tracking-widest text-gray-400 uppercase">
            OR
          </span>
        </div>

        {/* Guest Alternative */}
        <Link
          href="/modes"
          className="camp-btn camp-btn-white w-full py-2.5 text-xs font-bold text-gray-800 block text-center mb-5"
        >
          Skip Sign In & Play as Guest
        </Link>

        {/* Footer Link */}
        <div className="text-center text-xs font-semibold text-gray-600">
          <span>Don't have a basecamp account? </span>
          <Link
            href="/sign-up"
            className="text-amber-600 hover:text-amber-700 font-black underline underline-offset-4 decoration-2"
          >
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}