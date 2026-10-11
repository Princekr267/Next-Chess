"use client";

import React from "react";

interface BoardWithCoordinatesProps {
  orientation?: "white" | "black";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps the Chessboard in the claymorphic board tray and renders
 * rank numbers (1-8) and file letters (a-h) outside the 64 squares
 * on the wooden frame, keeping the playing squares pristine and clutter-free.
 */
export function BoardWithCoordinates({
  orientation = "white",
  children,
  className = "",
  style,
}: BoardWithCoordinatesProps) {
  const isWhite = orientation === "white";
  const ranks = isWhite
    ? ["8", "7", "6", "5", "4", "3", "2", "1"]
    : ["1", "2", "3", "4", "5", "6", "7", "8"];
  const files = isWhite
    ? ["a", "b", "c", "d", "e", "f", "g", "h"]
    : ["h", "g", "f", "e", "d", "c", "b", "a"];

  return (
    <div
      className={`camp-board-tray flex flex-col p-2 sm:p-3 relative select-none w-full ${className}`}
      style={style}
    >
      <div className="flex w-full items-stretch flex-1">
        {/* Left rank labels outside the chess grid */}
        <div className="flex flex-col justify-around pr-1.5 sm:pr-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-mono font-black text-amber-300/80 select-none">
          {ranks.map((rank) => (
            <div
              key={rank}
              className="flex-1 flex items-center justify-center min-h-0"
              style={{
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {rank}
            </div>
          ))}
        </div>

        {/* 8x8 Chessboard container */}
        <div className="flex-1 aspect-square relative min-w-0">
          {children}
        </div>
      </div>

      {/* Bottom file labels outside the chess grid */}
      <div className="flex w-full pl-5 sm:pl-7 pt-1 sm:pt-1.5 text-[10px] sm:text-xs font-mono font-black text-amber-300/80 select-none">
        {files.map((file) => (
          <div
            key={file}
            className="flex-1 flex items-center justify-center"
            style={{
              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            {file}
          </div>
        ))}
      </div>
    </div>
  );
}
