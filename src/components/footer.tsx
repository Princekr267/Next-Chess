import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto px-6 py-8 border-t-[2.5px] border-black bg-[#0f172a]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400">
        <p className="flex items-center gap-2">
          <span className="text-amber-400">♟</span>
          <span className="text-slate-300">© {new Date().getFullYear()} Chess Base. All rights reserved.</span>
        </p>
        <div className="flex items-center gap-6">
          <Link href="/modes" className="hover:text-amber-300 transition-colors">
            Game Modes
          </Link>
          <Link href="/play?mode=local" className="hover:text-amber-300 transition-colors">
            Local Board
          </Link>
          <Link href="/sign-in" className="hover:text-amber-300 transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="hover:text-amber-300 transition-colors">
            Sign Up
          </Link>
        </div>
      </div>
    </footer>
  );
}