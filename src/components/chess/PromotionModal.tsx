"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export type PromotionPiece = "q" | "r" | "b" | "n";

interface PromotionModalProps {
  isOpen: boolean;
  color: "w" | "b";
  fromSquare: string;
  toSquare: string;
  onSelectPiece: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

interface PieceOption {
  type: PromotionPiece;
  label: string;
  hotkey: string;
  points: string;
  getImage: (color: "w" | "b") => string;
  description: string;
}

const PROMOTION_OPTIONS: PieceOption[] = [
  {
    type: "q",
    label: "Queen",
    hotkey: "Q",
    points: "9 pts",
    getImage: (c) => (c === "w" ? "/wq_no_bg.png" : "/bq_no_bg.png"),
    description: "Most powerful piece",
  },
  {
    type: "n",
    label: "Knight",
    hotkey: "N",
    points: "3 pts",
    getImage: (c) => (c === "w" ? "/wh_no_bg.png" : "/bh_no_bg.png"),
    description: "Jumps over pieces",
  },
  {
    type: "r",
    label: "Rook",
    hotkey: "R",
    points: "5 pts",
    getImage: (c) => (c === "w" ? "/wr_no_bg.png" : "/br_no_bg.png"),
    description: "Ranks & files powerhouse",
  },
  {
    type: "b",
    label: "Bishop",
    hotkey: "B",
    points: "3 pts",
    getImage: (c) => (c === "w" ? "/wb_no_bg.png" : "/bb_no_bg.png"),
    description: "Long-range diagonal attacker",
  },
];

export function PromotionModal({
  isOpen,
  color,
  fromSquare,
  toSquare,
  onSelectPiece,
  onCancel,
}: PromotionModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === "escape") {
        e.preventDefault();
        onCancel();
      } else if (key === "q" || key === "1") {
        e.preventDefault();
        onSelectPiece("q");
      } else if (key === "n" || key === "2") {
        e.preventDefault();
        onSelectPiece("n");
      } else if (key === "r" || key === "3") {
        e.preventDefault();
        onSelectPiece("r");
      } else if (key === "b" || key === "4") {
        e.preventDefault();
        onSelectPiece("b");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onSelectPiece, onCancel]);

  if (!isOpen) return null;

  const colorLabel = color === "w" ? "White" : "Black";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="camp-card-canvas relative w-full max-w-md p-5 sm:p-6 text-center animate-in zoom-in-95 duration-150 rounded-2xl"
        style={{
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.7), inset -4px -4px 12px rgba(0,0,0,0.12), inset 4px 4px 12px rgba(255,255,255,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          title="Cancel Promotion (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span
            className={`camp-badge text-[11px] px-2.5 py-0.5 ${
              color === "w" ? "camp-badge-yellow" : "camp-badge-slate"
            }`}
          >
            ♟ Pawn Promotion
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
          Select Promotion Piece
        </h3>
        <p className="text-xs text-gray-600 mb-4 font-medium">
          {colorLabel} pawn advances{" "}
          <strong className="text-gray-900 font-bold uppercase">
            {fromSquare} → {toSquare}
          </strong>
          . Choose your new piece:
        </p>

        {/* Piece Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
          {PROMOTION_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => onSelectPiece(option.type)}
              className="group relative flex flex-col items-center justify-between p-3 rounded-xl border-2 border-[#d5c3aa] bg-[#fdf8f0] hover:bg-[#fff9ed] hover:border-amber-500 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer shadow-[3px_3px_0px_#261a0e] text-center select-none"
            >
              {/* Hotkey Indicator */}
              <span className="absolute top-1.5 right-1.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-950 border border-amber-300 shadow-xs">
                {option.hotkey}
              </span>

              {/* Piece Image */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center my-1">
                <img
                  src={option.getImage(color)}
                  alt={`${colorLabel} ${option.label}`}
                  className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-150 pointer-events-none"
                />
              </div>

              {/* Label & Value */}
              <div className="w-full mt-1">
                <div className="text-xs sm:text-sm font-black text-gray-900">
                  {option.label}
                </div>
                <div className="text-[10px] font-bold text-amber-800/80">
                  {option.points}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer / Cancel */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            Tip: Press <kbd className="px-1 py-0.5 rounded bg-gray-200 text-gray-800 font-mono text-[10px]">Q</kbd>, <kbd className="px-1 py-0.5 rounded bg-gray-200 text-gray-800 font-mono text-[10px]">N</kbd>, <kbd className="px-1 py-0.5 rounded bg-gray-200 text-gray-800 font-mono text-[10px]">R</kbd>, <kbd className="px-1 py-0.5 rounded bg-gray-200 text-gray-800 font-mono text-[10px]">B</kbd>
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="camp-btn camp-btn-slate text-xs py-1.5 px-3 font-black shadow-[1px_1px_0px_#000] ml-auto"
          >
            Cancel Move (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
