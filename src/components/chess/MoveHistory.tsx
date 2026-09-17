import React, { useEffect, useRef } from "react";
import { History, X } from "lucide-react";

interface MoveHistoryProps {
  moves: string[];
  isMobileDrawer?: boolean;
  onCloseDrawer?: () => void;
  className?: string;
}

export function MoveHistory({
  moves,
  isMobileDrawer = false,
  onCloseDrawer,
  className = "",
}: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const movePairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  // Auto-scroll to latest move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  if (isMobileDrawer) {
    return (
      <div
        className="absolute inset-x-3 bottom-14 z-50 rounded-2xl bg-[#20150a]/95 p-4 backdrop-blur-md max-h-[55vh] flex flex-col border border-amber-900/40 animate-in fade-in slide-in-from-bottom duration-200"
        style={{
          boxShadow:
            "0 12px 35px rgba(20,10,3,0.7), inset -4px -4px 10px rgba(28,18,6,0.5), inset 4px 4px 10px rgba(255,210,130,0.1)",
        }}
      >
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-amber-900/30">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Move Log ({moves.length} moves)
          </span>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="p-1 rounded-lg text-amber-200/70 hover:text-white hover:bg-amber-900/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-1.5 font-mono text-xs max-h-48">
          {movePairs.length === 0 ? (
            <div className="text-amber-200/40 text-xs italic py-6 text-center">
              No moves played yet
            </div>
          ) : (
            movePairs.map((pair) => (
              <div
                key={pair.num}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#140c05]/80 border border-amber-950 text-stone-300"
              >
                <span className="text-amber-500/70 w-8 font-bold">{pair.num}.</span>
                <span className="text-amber-300 font-semibold flex-1">{pair.white}</span>
                <span className="text-stone-200 font-semibold flex-1 text-right">
                  {pair.black || "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl bg-[#24190c]/95 border border-[#48331d]/60 p-3.5 flex flex-col flex-1 min-h-[160px] max-h-[300px] ${className}`}
      style={{
        boxShadow:
          "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
      }}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-900/30 text-[11px] font-black uppercase tracking-wider text-amber-200/70">
        <span className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-amber-400" />
          Notation Log
        </span>
        <span className="bg-amber-900/40 border border-amber-800/30 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full">
          {moves.length} {moves.length === 1 ? "move" : "moves"}
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-1 font-mono text-xs">
        {movePairs.length === 0 ? (
          <div className="text-stone-500 text-xs italic py-8 text-center flex flex-col items-center gap-1">
            <span>♟</span>
            <span>Moves will appear as pieces move</span>
          </div>
        ) : (
          movePairs.map((pair, idx) => {
            const isLatest = idx === movePairs.length - 1;
            return (
              <div
                key={pair.num}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border transition-colors ${
                  isLatest
                    ? "bg-[#332312] border-amber-500/40 text-amber-100"
                    : "bg-[#160d06]/70 border-amber-950/40 text-stone-300 hover:bg-[#1a1007]"
                }`}
              >
                <span className="text-amber-500/60 w-8 font-bold">{pair.num}.</span>
                <span className="text-amber-300 font-semibold flex-1 tracking-wide">{pair.white}</span>
                <span className="text-stone-200 font-semibold flex-1 text-right tracking-wide">
                  {pair.black || "—"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
