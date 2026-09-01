"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
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
    <nav className="relative z-50 flex items-center justify-between px-6 py-4 border-b">
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
              type="button"
              className={buttonVariants({ variant: "outline" })}
              onClick={handleSignOut}
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