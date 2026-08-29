"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export function CustomChessGame() {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());

  // ---- Responsive sizing ----
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(400);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setBoardSize(containerRef.current.offsetWidth);
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ---- Move handling ----
  // v5: onPieceDrop receives positional args (sourceSquare, targetSquare, piece)
  function onPieceDrop(
    sourceSquare: string,
    targetSquare: string,
    _piece: string
  ): boolean {
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      if (move === null) return false;
      setFen(game.fen());
      return true;
    } catch {
      return false;
    }
  }

  // ---- Custom piece art ----
  const pieceImages: Record<string, string> = {
    wP: "/pieces/white-pawn.svg",
    wN: "/pieces/white-knight.svg",
    wB: "/pieces/white-bishop.svg",
    wR: "/pieces/white-rook.svg",
    wQ: "/pieces/white-queen.svg",
    wK: "/pieces/white-king.svg",
    bP: "/pieces/black-pawn.svg",
    bN: "/pieces/black-knight.svg",
    bB: "/pieces/black-bishop.svg",
    bR: "/pieces/black-rook.svg",
    bQ: "/pieces/black-queen.svg",
    bK: "/pieces/black-king.svg",
  };

  const customPieces = Object.fromEntries(
    Object.entries(pieceImages).map(([code, src]) => [
      code,
      ({ squareWidth }: { squareWidth: number }) => (
        <img
          src={src}
          style={{ width: squareWidth * 0.85, height: squareWidth * 0.85 }}
          draggable={false}
        />
      ),
    ])
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: 500,
        aspectRatio: "1 / 1",
        margin: "0 auto",
      }}
    >
      {/* v5: all settings are direct props — the `options` object was removed */}
      <Chessboard
        id="custom-board"
        position={fen}
        onPieceDrop={onPieceDrop}
        customPieces={customPieces}
        customBoardStyle={{
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
        customDarkSquareStyle={{ backgroundColor: "#3a3a52" }}
        customLightSquareStyle={{ backgroundColor: "#e8e4d8" }}
        animationDurationInMs={200}
        showBoardNotation={true}
      />
    </div>
  );
}