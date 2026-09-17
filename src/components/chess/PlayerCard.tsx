import React from "react";

interface PlayerCardProps {
  color: "white" | "black";
  name: string;
  onNameChange: (val: string) => void;
  isTurn: boolean;
  isCompact?: boolean;
  className?: string;
  inputId?: string;
}

export function PlayerCard({
  color,
  name,
  onNameChange,
  isTurn,
  isCompact = false,
  className = "",
  inputId,
}: PlayerCardProps) {
  const isWhite = color === "white";
  const id = inputId || (isWhite ? "player-you" : "player-opponent");

  return (
    <div
      className={`w-full flex items-center justify-between rounded-2xl bg-slate-900/90 ${
        isCompact ? "px-2.5 py-1.5" : "px-3.5 py-2"
      } ${className}`}
      style={{ boxShadow: "4px 4px 10px rgba(28,18,6,0.45), inset -3px -3px 7px rgba(28,18,6,0.3), inset 3px 3px 7px rgba(255,210,130,0.1)" }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-[1px_1px_0px_#000] shrink-0 ${
            isWhite
              ? "bg-amber-300 text-amber-950"
              : "bg-slate-800 text-slate-200"
          }`}
        >
          {isWhite ? "♙" : "♟"}
        </div>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <label
            htmlFor={id}
            className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
              isWhite ? "text-amber-400/90" : "text-slate-400"
            }`}
          >
            {isWhite ? "White (You):" : "Black:"}
          </label>
          <input
            id={id}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-amber-950/40 border border-amber-800/40 rounded-md px-2 py-0.5 text-xs text-amber-100 font-bold focus:outline-none focus:border-amber-500 transition-colors w-24 xs:w-32 sm:w-44"
          />
        </div>
      </div>

      {isTurn && (
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse shrink-0 ${
            isWhite
              ? "bg-amber-300 text-amber-900"
              : "bg-slate-700 text-amber-200"
          }`}
          style={{ boxShadow: "2px 3px 7px rgba(28,18,6,0.4), inset -1px -1px 3px rgba(28,18,6,0.2), inset 1px 1px 3px rgba(255,215,140,0.35)" }}
        >
          {isWhite ? "Your Turn" : "To Move"}
        </span>
      )}
    </div>
  );
}
