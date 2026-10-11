"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseAvatar } from "@/lib/avatar";

const navLinks = [
  {
    href: "/modes",
    label: "Play",
    icon: "♟",
    description: "Local, Bot, or Friend Duel",
  },
  {
    href: "/history",
    label: "History",
    icon: "📜",
    description: "Review past games & analysis",
  },
];

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close expanded panel on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Scroll-compact: shrinks pill background/opacity when scrolled
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click-outside closes the expanded panel
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // History link only for signed-in users
  const visibleNavLinks = navLinks.filter(
    (link) => link.href !== "/history" || !!session
  );

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(href + "/") ||
    pathname.startsWith(href + "?");

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setIsOpen(false);
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
    setSigningOut(false);
  };

  // ── Brand Logo ─────────────────────────────────────────────────────────────
  const BrandLogo = () => (
    <Link
      href="/"
      onClick={() => setIsOpen(false)}
      className="flex items-center gap-2 group hover:scale-[1.03] active:scale-95 transition-transform shrink-0"
    >
      <span
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-300 flex items-center justify-center text-amber-950 font-black select-none text-base sm:text-lg group-hover:rotate-[-6deg] transition-transform duration-200 shrink-0"
        style={{
          boxShadow:
            "4px 4px 10px rgba(0,0,0,0.25), inset -3px -3px 6px rgba(0,0,0,0.15), inset 3px 3px 6px rgba(255,255,255,0.6)",
        }}
      >
        ♟
      </span>
      <div className="flex items-baseline gap-0.5 leading-none">
        <span className="text-amber-300 font-black text-base sm:text-lg tracking-tight">
          NEXT-
        </span>
        <span className="text-white font-black text-base sm:text-lg tracking-tight">
          CHESS
        </span>
      </div>
    </Link>
  );

  // ── Desktop (md+): always-visible inline pill ──────────────────────────────
  const DesktopNav = () => (
    <div
      className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-full"
      style={{
        background: isScrolled
          ? "rgba(15, 23, 42, 0.9)"
          : "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow:
          "8px 8px 24px rgba(0,0,0,0.35), inset -5px -5px 12px rgba(0,0,0,0.25), inset 5px 5px 12px rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "all 0.3s ease",
      }}
    >
      <BrandLogo />
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* Nav Links */}
      <div className="flex items-center gap-1.5">
        {visibleNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
              isActive(link.href)
                ? "text-amber-950 font-black"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
            style={
              isActive(link.href)
                ? {
                    background:
                      "linear-gradient(145deg, #fde68a 0%, #fcd34d 100%)",
                    boxShadow:
                      "3px 3px 8px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(0,0,0,0.1), inset 2px 2px 5px rgba(255,255,255,0.6)",
                  }
                : {}
            }
          >
            <span className="text-sm leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* Auth Area */}
      {isPending ? (
        <div className="w-24 h-8 rounded-2xl bg-slate-700/50 animate-pulse" />
      ) : session ? (
        <div className="flex items-center gap-2">
          {(() => {
            const avatar = parseAvatar(session.user.image, session.user.name);
            return (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 py-1 rounded-full hover:scale-[1.02] active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(145deg, #334155 0%, #1e293b 100%)",
                  boxShadow:
                    "4px 4px 10px rgba(0,0,0,0.25), inset -3px -3px 7px rgba(0,0,0,0.2), inset 3px 3px 7px rgba(255,255,255,0.05)",
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black leading-none select-none shrink-0"
                  style={{
                    backgroundColor: avatar.bg,
                    color: avatar.textColor,
                    boxShadow:
                      "2px 2px 6px rgba(0,0,0,0.2), inset -1px -1px 3px rgba(0,0,0,0.15), inset 1px 1px 3px rgba(255,255,255,0.6)",
                  }}
                >
                  {avatar.piece}
                </span>
                <span className="text-xs font-black text-amber-200 max-w-[90px] truncate">
                  {session.user.name}
                </span>
              </Link>
            );
          })()}
          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="camp-btn camp-btn-slate text-xs py-1.5 px-3.5 font-black disabled:opacity-50"
          >
            {signingOut ? "…" : "Sign Out"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  );

  // ── Mobile (< md): responsive clay bar with smooth drawer ──────────────────
  const MobileNav = () => {
    const avatar = session ? parseAvatar(session.user.image, session.user.name) : null;

    return (
      <div className="md:hidden w-full max-w-md px-3" ref={containerRef}>
        <motion.div
          layout
          initial={false}
          animate={{
            borderRadius: isOpen ? 22 : 9999,
          }}
          transition={{
            layout: { type: "spring", stiffness: 380, damping: 32 },
            borderRadius: { duration: 0.2, ease: "easeInOut" },
          }}
          style={{
            background: isScrolled
              ? "rgba(15, 23, 42, 0.92)"
              : "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow:
              "8px 8px 24px rgba(0,0,0,0.4), inset -4px -4px 10px rgba(0,0,0,0.25), inset 4px 4px 10px rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            transition: "background 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          {/* Top header row */}
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <BrandLogo />

            <div className="flex items-center gap-2">
              {/* Quick profile avatar button on mobile */}
              {session && avatar && !isOpen && (
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black leading-none select-none shrink-0 hover:scale-105 active:scale-95 transition-transform"
                  style={{
                    backgroundColor: avatar.bg,
                    color: avatar.textColor,
                    boxShadow:
                      "2px 2px 6px rgba(0,0,0,0.25), inset -1px -1px 3px rgba(0,0,0,0.2), inset 1px 1px 3px rgba(255,255,255,0.6)",
                  }}
                  title="Your Profile"
                >
                  {avatar.piece}
                </Link>
              )}

              {/* Hamburger / Close Toggle button */}
              <motion.button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-200 transition-colors"
                style={{
                  background: isOpen
                    ? "linear-gradient(145deg, #fde68a 0%, #fcd34d 100%)"
                    : "rgba(255,255,255,0.09)",
                  boxShadow: isOpen
                    ? "3px 3px 8px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(0,0,0,0.1), inset 2px 2px 5px rgba(255,255,255,0.5)"
                    : "2px 2px 6px rgba(0,0,0,0.15)",
                  color: isOpen ? "#78350f" : undefined,
                }}
              >
                <motion.svg
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  {isOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                    </>
                  )}
                </motion.svg>
              </motion.button>
            </div>
          </div>

          {/* Expanded mobile panel */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-3 pb-3.5 pt-1 flex flex-col gap-2">
                  <div className="h-px bg-slate-700/60 my-1" />

                  {/* Navigation links */}
                  <div className="flex flex-col gap-1.5">
                    {visibleNavLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                          isActive(link.href)
                            ? "text-amber-950 font-black"
                            : "text-slate-200 hover:text-white hover:bg-white/10"
                        }`}
                        style={
                          isActive(link.href)
                            ? {
                                background:
                                  "linear-gradient(145deg, #fde68a 0%, #fcd34d 100%)",
                                boxShadow:
                                  "3px 3px 8px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(0,0,0,0.1), inset 2px 2px 5px rgba(255,255,255,0.6)",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                              }
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{link.icon}</span>
                          <div className="flex flex-col text-left">
                            <span>{link.label}</span>
                            <span className="text-[10px] font-normal lowercase tracking-normal opacity-70">
                              {link.description}
                            </span>
                          </div>
                        </div>
                        {isActive(link.href) && (
                          <span className="w-2 h-2 rounded-full bg-amber-950" />
                        )}
                      </Link>
                    ))}

                    {/* Profile link for mobile */}
                    {session && (
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                          isActive("/profile")
                            ? "text-amber-950 font-black"
                            : "text-slate-200 hover:text-white hover:bg-white/10"
                        }`}
                        style={
                          isActive("/profile")
                            ? {
                                background:
                                  "linear-gradient(145deg, #fde68a 0%, #fcd34d 100%)",
                                boxShadow:
                                  "3px 3px 8px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(0,0,0,0.1), inset 2px 2px 5px rgba(255,255,255,0.6)",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                              }
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">👤</span>
                          <div className="flex flex-col text-left">
                            <span>My Profile</span>
                            <span className="text-[10px] font-normal lowercase tracking-normal opacity-70">
                              Stats, rating & achievements
                            </span>
                          </div>
                        </div>
                        {isActive("/profile") && (
                          <span className="w-2 h-2 rounded-full bg-amber-950" />
                        )}
                      </Link>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-700/60 my-1" />

                  {/* Mobile Auth Area */}
                  {isPending ? (
                    <div className="w-full h-9 rounded-xl bg-slate-700/50 animate-pulse" />
                  ) : session ? (
                    <div className="flex flex-col gap-2">
                      <div
                        className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {avatar && (
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                              style={{
                                backgroundColor: avatar.bg,
                                color: avatar.textColor,
                                boxShadow:
                                  "2px 2px 5px rgba(0,0,0,0.25), inset 1px 1px 2px rgba(255,255,255,0.5)",
                              }}
                            >
                              {avatar.piece}
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-amber-200 truncate">
                              {session.user.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {session.user.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={signingOut}
                        onClick={handleSignOut}
                        className="camp-btn camp-btn-slate w-full py-2.5 text-xs font-black disabled:opacity-50"
                      >
                        {signingOut ? "Signing out…" : "Sign Out"}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href="/sign-in"
                        onClick={() => setIsOpen(false)}
                        className="camp-btn camp-btn-white py-2 text-xs font-black text-center"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setIsOpen(false)}
                        className="camp-btn camp-btn-yellow py-2 text-xs font-black text-center"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden pointer-events-auto"
          />
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 z-50 px-3 py-2.5 sm:py-3 flex items-start justify-center pointer-events-none">
        <div className="pointer-events-auto w-full flex justify-center">
          <DesktopNav />
          <MobileNav />
        </div>
      </header>
    </>
  );
}