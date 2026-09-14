"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/modes", label: "Play", icon: "♟" },
  { href: "/history", label: "History", icon: "📜" },
];

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
    setSigningOut(false);
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");

  return (
    <>
      <nav className="relative z-50 bg-[#0c1120] border-b-[2.5px] border-black shadow-[0_4px_0_#000000]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">

          {/* ── Brand ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group hover:scale-[1.03] active:scale-95 transition-transform"
          >
            <span className="w-9 h-9 rounded-xl bg-amber-400 border-[2.5px] border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center text-black text-lg font-black select-none group-hover:rotate-[-6deg] transition-transform duration-200">
              ♟
            </span>
            <div className="flex items-baseline gap-0.5 leading-none">
              <span className="text-amber-400 font-black text-xl tracking-tight">NEXT-</span>
              <span className="text-white font-black text-xl tracking-tight">CHESS</span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-[2px] transition-all duration-150 ${
                  isActive(link.href)
                    ? "bg-amber-400 text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "text-slate-300 border-transparent hover:text-white hover:bg-white/5 hover:border-slate-700"
                }`}
              >
                <span className="text-sm leading-none">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Desktop Auth Area ── */}
          <div className="hidden sm:flex items-center gap-2">
            {isPending ? (
              <div className="w-20 h-7 rounded-xl bg-slate-800 animate-pulse" />
            ) : session ? (
              <>
                {/* User pill with avatar + name + rating */}
                <div className="flex items-center gap-2 bg-slate-800 border-[2px] border-slate-700 rounded-full px-2.5 py-1 shadow-[2px_2px_0px_#000000]">
                  <span className="w-6 h-6 rounded-full bg-amber-400 border border-black flex items-center justify-center text-[11px] font-black text-black leading-none select-none">
                    {session.user.name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                  <span className="text-xs font-black text-amber-300 max-w-[100px] truncate">
                    {session.user.name}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="camp-btn camp-btn-slate text-xs py-1.5 px-3.5 font-black disabled:opacity-50"
                >
                  {signingOut ? "…" : "Sign Out"}
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

          {/* ── Mobile: Hamburger ── */}
          <button
            type="button"
            className="sm:hidden camp-btn camp-btn-slate p-2 text-white"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5 transition-transform duration-200"
              style={{ transform: mobileOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="sm:hidden border-t-[2px] border-black bg-[#0c1120] px-4 py-4 flex flex-col gap-3 animate-in slide-in-from-top duration-200">
            {/* Nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider border-[2px] transition-all ${
                  isActive(link.href)
                    ? "bg-amber-400 text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "text-slate-300 border-slate-700 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="border-t border-slate-800" />

            {/* Auth area */}
            {isPending ? (
              <div className="w-full h-9 rounded-xl bg-slate-800 animate-pulse" />
            ) : session ? (
              <>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="w-8 h-8 rounded-full bg-amber-400 border-[2px] border-black flex items-center justify-center text-sm font-black text-black shrink-0">
                    {session.user.name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-amber-300 truncate">
                      {session.user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {session.user.email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="camp-btn camp-btn-slate w-full py-2 text-sm font-black disabled:opacity-50"
                >
                  {signingOut ? "Signing out…" : "Sign Out"}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="camp-btn camp-btn-white w-full py-2.5 text-sm font-black text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="camp-btn camp-btn-yellow w-full py-2.5 text-sm font-black text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}