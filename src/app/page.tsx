import Board from "@/components/ui/board";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* <Board /> */}
      <Hero />
      <HowItWorks />
    </div>
  );
}
