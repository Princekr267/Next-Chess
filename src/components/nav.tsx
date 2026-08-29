"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";

export function Nav() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-bold text-lg">
        ChessApp
      </Link>

      <div className="flex items-center gap-4">
        {isPending ? null : session ? (
          <>
            <span className="text-sm text-muted-foreground">
              {session.user.name}
            </span>
            <button
              className={buttonVariants({ variant: "outline" })}
              onClick={() => authClient.signOut()}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "ghost" })}
            >
              Sign In
            </Link>
            <Link href="/sign-up" className={buttonVariants()}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}