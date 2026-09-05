"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Something went wrong. Please try again.");
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
        {/* Floating Badge */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
          <span className="camp-badge camp-badge-teal shadow-[3px_3px_0px_#000000] text-xs px-4 py-1 text-white">
            ★ NEW TACTICIAN
          </span>
        </div>

        {/* Header */}
        <div className="text-center mt-2 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400 border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center mx-auto mb-3 text-2xl font-black">
            ⚔️
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950">
            Join Chess Base
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">
            Create your account to claim your tag & climb match ratings
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
              htmlFor="name"
              className="block text-xs font-extrabold uppercase tracking-wider text-gray-800 mb-1.5"
            >
              Tactician Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Grandmaster Bobby"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-gray-900 font-semibold placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/50 shadow-[2px_2px_0px_#000000] transition-all"
            />
          </div>

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
              placeholder="player@chessbase.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-gray-900 font-semibold placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/50 shadow-[2px_2px_0px_#000000] transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-extrabold uppercase tracking-wider text-gray-800 mb-1.5"
            >
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-gray-900 font-semibold placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/50 shadow-[2px_2px_0px_#000000] transition-all pr-12"
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
            className="camp-btn camp-btn-teal w-full py-3.5 mt-2 text-base font-black tracking-wide flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Enrolling into Base...</span>
            ) : (
              <>
                <span>Create Basecamp Account</span>
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
            ALREADY REGISTERED?
          </span>
        </div>

        {/* Sign In Link */}
        <Link
          href="/sign-in"
          className="camp-btn camp-btn-white w-full py-2.5 text-xs font-bold text-gray-800 block text-center mb-4"
        >
          Sign In to Existing Account
        </Link>
      </motion.div>
    </div>
  );
}