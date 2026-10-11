import { TacticianHero } from "@/components/TacticianHero";
import { HowItWorks } from "@/components/how-it-works";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans w-full overflow-x-hidden">
      <TacticianHero />
      <HowItWorks />
    </div>
  );
}
