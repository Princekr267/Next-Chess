"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/modes", label: "Play", icon: "♟" },
  { href: "/history", label: "History", icon: "📜" },
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

  // Scroll-compact: shrinks pill padding when scrolled past 20px
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
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
    setSigningOut(false);
  };

  // ── Shared sub-components ────────────────────────────────────────────────

  const BrandLogo = ({ compact = false }: { compact?: boolean }) => (
    <Link
      href="/"
      onClick={() => setIsOpen(false)}
      className="flex items-center gap-2 group hover:scale-[1.03] active:scale-95 transition-transform shrink-0"
    >
      <span
        className={`rounded-2xl bg-amber-300 flex items-center justify-center text-amber-950 font-black select-none group-hover:rotate-[-6deg] transition-transform duration-200 ${
          compact ? "w-8 h-8 text-base" : "w-9 h-9 text-lg"
        }`}
        style={{
          boxShadow:
            "4px 4px 10px rgba(0,0,0,0.2), inset -3px -3px 6px rgba(0,0,0,0.15), inset 3px 3px 6px rgba(255,255,255,0.6)",
        }}
      >
        ♟
      </span>
      {!compact && (
        <div className="flex items-baseline gap-0.5 leading-none">
          <span className="text-amber-300 font-black text-lg tracking-tight">
            NEXT-
          </span>
          <span className="text-white font-black text-lg tracking-tight">
            CHESS
          </span>
        </div>
      )}
    </Link>
  );

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {visibleNavLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
            isActive(link.href)
              ? "text-amber-900"
              : "text-slate-300 hover:text-white hover:bg-white/8"
          }`}
          style={
            isActive(link.href)
              ? {
                  background:
                    "linear-gradient(145deg, #fde68a 0%, #fcd34d 100%)",
                  boxShadow:
                    "3px 3px 8px rgba(0,0,0,0.15), inset -2px -2px 5px rgba(0,0,0,0.1), inset 2px 2px 5px rgba(255,255,255,0.5)",
                }
              : {}
          }
        >
          <span className="text-sm leading-none">{link.icon}</span>
          {link.label}
        </Link>
      ))}
    </>
  );

  const AuthArea = ({
    layout = "row",
  }: {
    layout?: "row" | "col";
  }) => {
    if (isPending) {
      return (
        <div
          className={`${layout === "col" ? "w-full" : "w-24"} h-8 rounded-2xl bg-slate-700/50 animate-pulse`}
        />
      );
    }
    if (session) {
      return (
        <div className={`flex ${layout === "col" ? "flex-col gap-2 w-full" : "flex-row items-center gap-2"}`}>
          {/* User pill linking to /profile */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full hover:scale-[1.02] active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(145deg, #334155 0%, #1e293b 100%)",
              boxShadow:
                "4px 4px 10px rgba(0,0,0,0.25), inset -3px -3px 7px rgba(0,0,0,0.2), inset 3px 3px 7px rgba(255,255,255,0.05)",
            }}
          >
            <span
              className="w-6 h-6 rounded-full bg-amber-300 flex items-center justify-center text-[11px] font-black text-amber-950 leading-none select-none shrink-0"
              style={{
                boxShadow:
                  "2px 2px 6px rgba(0,0,0,0.2), inset -1px -1px 3px rgba(0,0,0,0.15), inset 1px 1px 3px rgba(255,255,255,0.6)",
              }}
            >
              {session.user.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <span className="text-xs font-black text-amber-200 max-w-[90px] truncate">
              {session.user.name}
            </span>
          </Link>
          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className={`camp-btn camp-btn-slate text-xs py-1.5 px-3.5 font-black disabled:opacity-50 ${layout === "col" ? "w-full" : ""}`}
          >
            {signingOut ? "…" : "Sign Out"}
          </button>
        </div>
      );
    }
    return (
      <div className={`flex ${layout === "col" ? "flex-col gap-2 w-full" : "flex-row items-center gap-2"}`}>
        <Link
          href="/sign-in"
          onClick={() => setIsOpen(false)}
          className={`camp-btn camp-btn-white text-xs py-1.5 px-4 font-black ${layout === "col" ? "w-full text-center" : ""}`}
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          onClick={() => setIsOpen(false)}
          className={`camp-btn camp-btn-yellow text-xs py-1.5 px-4 font-black ${layout === "col" ? "w-full text-center" : ""}`}
        >
          Sign Up
        </Link>
      </div>
    );
  };

  // ── Desktop (xl+): always-visible inline pill ────────────────────────────
  const DesktopNav = () => (
    <div
      className="hidden xl:flex items-center gap-3 px-4 py-2.5 rounded-full"
      style={{
        background: isScrolled
          ? "rgba(15, 23, 42, 0.85)"
          : "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow:
          "8px 8px 20px rgba(0,0,0,0.3), inset -5px -5px 12px rgba(0,0,0,0.2), inset 5px 5px 12px rgba(255,255,255,0.04)",
        transition: "all 0.3s ease",
      }}
    >
      <BrandLogo />
      <div className="w-px h-5 bg-slate-700 mx-1" />
      <div className="flex items-center gap-1">
        <NavLinks />
      </div>
      <div className="w-px h-5 bg-slate-700 mx-1" />
      <AuthArea layout="row" />
    </div>
  );

  // ── Mobile/Tablet (< xl): compact pill + morph interaction ───────────────
  const MobileNav = () => (
    <div className="xl:hidden" ref={containerRef}>
      <motion.div
        layout
        initial={false}
        animate={{
          borderRadius: isOpen ? 24 : 9999,
          width: isOpen ? "min(400px, calc(100vw - 24px))" : "auto",
        }}
        transition={{
          layout: { type: "spring", stiffness: 380, damping: 32 },
          borderRadius: { duration: 0.25, ease: "easeInOut" },
          width: { type: "spring", stiffness: 380, damping: 32 },
        }}
        style={{
          background: isScrolled
            ? "rgba(15, 23, 42, 0.9)"
            : "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow:
            "8px 8px 20px rgba(0,0,0,0.3), inset -5px -5px 12px rgba(0,0,0,0.2), inset 5px 5px 12px rgba(255,255,255,0.04)",
          overflow: "hidden",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {/* Compact pill row — always visible */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <BrandLogo compact={!isOpen} />

          {/* Inline links visible in expanded header row on wider mobile */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.08, duration: 0.18 }}
                className="flex items-center gap-1 flex-1 min-w-0"
              >
                <NavLinks onClick={() => setIsOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid / Close toggle button */}
          <motion.button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center text-slate-200"
            style={{
              background: isOpen
                ? "linear-gradient(145deg, #fde68a 0%, #fcd34d 100%)"
                : "rgba(255,255,255,0.08)",
              boxShadow: isOpen
                ? "3px 3px 8px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(0,0,0,0.1), inset 2px 2px 5px rgba(255,255,255,0.5)"
                : "2px 2px 6px rgba(0,0,0,0.15)",
              color: isOpen ? "#78350f" : undefined,
              transition: "background 0.2s ease, color 0.2s ease",
            }}
          >
            <motion.svg
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-4.5 h-4.5"
              style={{ width: 18, height: 18 }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                // Grid/menu icon — more distinctive than hamburger
                <>
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </>
              )}
            </motion.svg>
          </motion.button>
        </div>

        {/* Expanded panel contents */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: 0.1, duration: 0.18 }}
                className="px-3 pb-3 flex flex-col gap-2"
              >
                {/* Divider */}
                <div className="h-px bg-slate-700/60 my-1" />

                {/* Auth section */}
                <AuthArea layout="col" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 py-3 flex items-start justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}