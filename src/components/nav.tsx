"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Nav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
  };

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-3.5 bg-[#0f172a] border-b-[2.5px] border-black shadow-[0_4px_0_#000000]">
      {/* Brand logo & title: Chess Base */}
      <Link
        href="/"
        className="font-black text-xl tracking-tight text-white hover:scale-105 active:scale-95 transition-transform flex items-center gap-2.5"
      >
        <span className="w-9 h-9 rounded-xl bg-amber-400 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center text-black text-lg font-black">
          ♟
        </span>
        <div className="flex items-center gap-0.5">
          <span className="text-amber-400">NEXT-</span>
          <span className="text-white">CHESS</span>
        </div>
      </Link>

      {/* Nav Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/modes"
          className="text-xs font-bold text-amber-300 hover:text-white transition-colors px-2 py-1 hidden sm:block uppercase tracking-wider"
        >
          Game Modes
        </Link>

        {isPending ? null : session ? (
          <>
            <span className="text-xs font-black text-black bg-amber-300 px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_#000000]">
              {session.user.name}
            </span>
            <button
              type="button"
              className="camp-btn camp-btn-slate text-xs py-1.5 px-3.5"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="camp-btn camp-btn-white text-xs py-1.5 px-4 font-black"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="camp-btn camp-btn-yellow text-xs py-1.5 px-4 font-black"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}