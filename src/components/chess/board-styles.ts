import React from "react";
import { Chess, Square } from "chess.js";

export const darkSquareStyle: React.CSSProperties = {
  backgroundColor: "#4a3828",
  backgroundImage:
    "linear-gradient(145deg, rgba(88, 66, 50, 0.3) 0%, rgba(52, 36, 26, 0.4) 60%, rgba(30, 19, 12, 0.5) 100%)",
  boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.15)",
};

export const lightSquareStyle: React.CSSProperties = {
  backgroundColor: "#e8dcc8",
  backgroundImage:
    "linear-gradient(145deg, rgba(255, 255, 255, 0.28) 0%, rgba(220, 205, 178, 0.2) 50%, rgba(196, 178, 150, 0.3) 100%)",
  boxShadow: "inset 0 0 0 1px rgba(190, 168, 138, 0.2)",
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
