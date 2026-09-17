import React from "react";
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
  const movePairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  if (isMobileDrawer) {
    return (
      <div className="absolute inset-x-2 bottom-14 z-50 rounded-2xl bg-slate-900/95 p-3.5 backdrop-blur-md max-h-[50vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200"
        style={{ boxShadow: "0 8px 30px rgba(20,10,3,0.65), inset -4px -4px 10px rgba(28,18,6,0.4), inset 4px 4px 10px rgba(255,210,130,0.05)" }}>
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Match Moves ({moves.length})
          </span>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 font-mono text-xs max-h-44">
          {movePairs.length === 0 ? (
            <div className="text-slate-500 text-xs italic py-4 text-center">
              No moves played yet
            </div>
          ) : (
            movePairs.map((pair) => (
              <div
                key={pair.num}
                className="flex items-center justify-between px-2 py-1 rounded bg-black/40 text-slate-300"
              >
                <span className="text-slate-500 w-7 font-bold">{pair.num}.</span>
                <span className="text-amber-300 font-semibold flex-1">{pair.white}</span>
                <span className="text-slate-200 font-semibold flex-1 text-right">
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
      className={`w-full rounded-2xl bg-slate-900/80 p-3 flex flex-col flex-1 min-h-[140px] max-h-[260px] ${className}`}
      style={{ boxShadow: "4px 4px 12px rgba(28,18,6,0.45), inset -3px -3px 8px rgba(28,18,6,0.3), inset 3px 3px 8px rgba(255,210,130,0.07)" }}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
        <span>Match History</span>
        <span className="text-amber-400 font-mono text-[10px]">{moves.length} moves</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 space-y-1 font-mono text-xs">
        {movePairs.length === 0 ? (
          <div className="text-slate-500 text-xs italic py-6 text-center">
            Moves will appear here as you play
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.num}
              className="flex items-center justify-between px-2.5 py-1 rounded bg-black/40 text-slate-300 hover:bg-black/60 transition-colors"
            >
              <span className="text-slate-500 w-8 font-bold">{pair.num}.</span>
              <span className="text-amber-300 font-semibold flex-1">{pair.white}</span>
              <span className="text-slate-200 font-semibold flex-1 text-right">
                {pair.black || "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
