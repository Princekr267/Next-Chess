import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="px-6 py-8">
      <Separator className="mb-6" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ChessApp. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/play" className="hover:text-foreground">Play</Link>
          <Link href="/sign-in" className="hover:text-foreground">Sign In</Link>
          <Link href="/sign-up" className="hover:text-foreground">Sign Up</Link>
        </div>
      </div>
    </footer>
  );
}