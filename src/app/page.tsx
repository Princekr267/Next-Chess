import Board from "@/components/ui/board";
import { HowItWorks } from "@/components/how-it-works";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* <Board /> */}
      <div>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Blanditiis, rem quibusdam adipisci nemo placeat, assumenda temporibus eos nesciunt omnis in dolorem eaque ipsam repellat quia, consequatur obcaecati possimus error vel.</div>
      <HowItWorks />
    </div>
  );
}
