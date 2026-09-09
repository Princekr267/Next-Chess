import React from "react";
import { Chess, Square } from "chess.js";

export const darkSquareStyle: React.CSSProperties = {
  backgroundColor: "#3a2b22",
  backgroundImage:
    "linear-gradient(135deg, rgba(78, 56, 45, 0.28) 0%, rgba(45, 31, 24, 0.4) 60%, rgba(26, 17, 12, 0.55) 100%)",
  boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.25)",
};

export const lightSquareStyle: React.CSSProperties = {
  backgroundColor: "#dfd2bc",
  backgroundImage:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(210, 194, 168, 0.25) 50%, rgba(184, 166, 138, 0.35) 100%)",
  boxShadow: "inset 0 0 0 1px rgba(180, 158, 128, 0.3)",
};

export const dropSquareStyle: React.CSSProperties = {
  boxShadow: "inset 0 0 0 3px #d97724, inset 0 0 10px rgba(217, 119, 36, 0.4)",
};

export function getDarkNotationStyle(isMobile: boolean): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    color: "rgba(223, 210, 188, 0.65)",
    fontWeight: 700,
    fontSize: isMobile ? "9px" : "11px",
    fontFamily: "inherit",
    userSelect: "none",
  };
}

export function getLightNotationStyle(isMobile: boolean): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    color: "rgba(58, 43, 34, 0.75)",
    fontWeight: 700,
    fontSize: isMobile ? "9px" : "11px",
    fontFamily: "inherit",
    userSelect: "none",
  };
}

export function buildSquareStyles(
  selectedSquare: Square | null,
  game: Chess
): Record<string, React.CSSProperties> {
  const styles: Record<string, React.CSSProperties> = {};

  if (!selectedSquare) {
    return styles;
  }

  styles[selectedSquare] = {
    backgroundColor: "rgba(30, 144, 255, 0.4)",
  };

  const legalMoves = game.moves({
    square: selectedSquare,
    verbose: true,
  });

  for (const move of legalMoves) {
    const isCapture = move.captured != null;

    styles[move.to] = {
      background: isCapture
        ? "radial-gradient(circle, transparent 55%, rgba(220, 20, 60, 0.55) 55%)"
        : "radial-gradient(circle, rgba(0, 0, 0, 0.3) 20%, transparent 20%)",
      borderRadius: "50%",
    };
  }

  return styles;
}
