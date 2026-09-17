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
      className={`w-full flex items-center justify-between rounded-2xl transition-all duration-200 ${
        isTurn
          ? "bg-[#332415] border-2 border-amber-500/40 ring-2 ring-amber-500/20"
          : "bg-[#261a0e]/95 border border-[#48331d]/60"
      } ${isCompact ? "px-3 py-1.5" : "px-4 py-2.5"} ${className}`}
      style={{
        boxShadow: isTurn
          ? "0 6px 20px rgba(24,14,5,0.45), inset -3px -3px 8px rgba(24,14,5,0.35), inset 3px 3px 8px rgba(255,215,130,0.12)"
          : "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Piece Emblem */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-transform ${
            isWhite
              ? "bg-amber-300 text-amber-950"
              : "bg-[#181008] text-amber-100 border border-amber-900/40"
          }`}
          style={{
            boxShadow: isWhite
              ? "2px 2px 6px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(180,120,30,0.3), inset 2px 2px 4px rgba(255,255,255,0.7)"
              : "2px 2px 6px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,210,130,0.15)",
          }}
        >
          {isWhite ? "♙" : "♟"}
        </div>

        {/* Player Name and Color Tag */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <label
            htmlFor={id}
            className={`text-[11px] sm:text-xs font-black uppercase tracking-wider shrink-0 ${
              isWhite ? "text-amber-300/90" : "text-stone-400"
            }`}
          >
            {isWhite ? "White (You):" : "Black:"}
          </label>
          <input
            id={id}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-[#181008]/70 border border-amber-900/40 rounded-lg px-2.5 py-1 text-xs sm:text-sm text-amber-100 font-bold focus:outline-none focus:border-amber-400 focus:bg-[#181008] transition-all w-28 sm:w-44 placeholder:text-stone-500 shadow-inner"
            placeholder={isWhite ? "Your Name" : "Opponent Name"}
          />
        </div>
      </div>

      {/* Turn indicator */}
      {isTurn ? (
        <span
          className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shrink-0 animate-pulse flex items-center gap-1.5 ${
            isWhite
              ? "bg-amber-300 text-amber-950 font-black shadow-sm"
              : "bg-stone-700 text-amber-200 border border-amber-500/30"
          }`}
          style={{
            boxShadow:
              "2px 3px 8px rgba(0,0,0,0.35), inset -1px -1px 3px rgba(0,0,0,0.2), inset 1px 1px 3px rgba(255,255,255,0.4)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping inline-block" />
          {isWhite ? "Your Turn" : "To Move"}
        </span>
      ) : (
        <span className="text-[10px] font-bold text-stone-500 px-2 py-0.5 uppercase tracking-wider shrink-0 hidden sm:inline-block">
          Waiting
        </span>
      )}
    </div>
  );
}
