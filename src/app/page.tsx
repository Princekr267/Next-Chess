import Board from "@/components/ui/board";
import { HowItWorks } from "@/components/how-it-works";
import "./globals.css"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      {/* <Board /> */}
      <HowItWorks />
    </div>
  );
}
