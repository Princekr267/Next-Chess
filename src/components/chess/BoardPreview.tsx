"use client";

import { Chessboard } from "react-chessboard";
import {
  darkSquareStyle,
  lightSquareStyle,
} from "./board-styles";
import { customPieces } from "./pieces";

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * A small, non-interactive board preview used on the landing page.
 * Shows the starting position to give visitors an immediate visual
 * impression of the game before they commit to clicking "Play."
 *
 * Uses the camp custom pieces and carved-wood square colors to match
 * the in-game board faithfully.
 *
 * Designed to be scalable: accepts optional `position` (FEN string, or "start")
 * and `orientation` props for reuse on other pages (e.g. match history previews).
 */
export function BoardPreview({
  position = STARTING_FEN,
  orientation = "white" as "white" | "black",
  className = "",
}: {
  position?: string;
  orientation?: "white" | "black";
  className?: string;
}) {
  const resolvedPosition = position === "start" ? STARTING_FEN : position;

  return (
    <div
      className={`camp-board-tray touch-none select-none pointer-events-none ${className}`}
      style={{ aspectRatio: "1 / 1" }}
    >
      <Chessboard
        options={{
          id: "preview-board",
          position: resolvedPosition,
          boardOrientation: orientation,
          allowDragging: false,
          showNotation: false,
          showAnimations: false,
          pieces: customPieces,
          boardStyle: {
            borderRadius: "8px",
            boxShadow:
              "inset 0 0 8px rgba(0,0,0,0.6), 0 4px 18px rgba(0,0,0,0.45)",
            overflow: "hidden",
            aspectRatio: "1 / 1",
            touchAction: "none",
          },
          darkSquareStyle,
          lightSquareStyle,
        }}
      />
    </div>
  );
}


