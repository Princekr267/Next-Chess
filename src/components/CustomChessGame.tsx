"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export function CustomChessGame() {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());

  // ---- Responsive sizing ----
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        // intentionally left for future use
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ---- Move handling ----
  // This version's onPieceDrop receives a destructured object: { piece, sourceSquare, targetSquare }
  function onPieceDrop({
    sourceSquare,
    targetSquare,
  }: {
    piece: { isSparePiece: boolean; position: string; pieceType: string };
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean {
    if (!targetSquare) return false;
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
  // Files in public/ are served from the root, so paths should not include /public
  const pieceStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    pointerEvents: "none" as const,
  };

  const makePiece = (src: string, alt: string, size = "100%") => () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px",
        boxSizing: "border-box",
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          ...pieceStyle,
          width: size,
          height: size,
        }}
      />
    </div>
  );

  const pieces = {
    wP: makePiece("/wp_no_bg.png", "White pawn", "82%"),
    wN: makePiece("/wh_no_bg.png", "White knight", "70%"),
    wK: makePiece("/wk_no_bg.png", "White king", "66%"),
    wB: makePiece("/wb_no_bg.png", "Black bishop", "100%"),
    wR: makePiece("/wr_no_bg.png", "White rook", "66%"),
    wQ: makePiece("/wq_no_bg.png", "White queen", "66%"),
    bP: makePiece("/bp_no_bg.png", "Black pawn", "110%"),
    bN: makePiece("/bh_no_bg.png", "Black knight", "100%"),
    bK: makePiece("/bk_no_bg.png", "Black king", "100%"),
    bB: makePiece("/bb_no_bg.png", "Black Bishop", "100%"),
    bR: makePiece("/br_no_bg.png", "Black Rook", "100%"),
    bQ: makePiece("/bq_no_bg.png", "Black queen", "100%"),
    
    // wP: () => <img src="/wp_no_bg.png" alt="White pawn" style={pieceStyle} draggable={false} />,
    // wN: () => <img src="/wh_no_bg.png" alt="White knight" style={pieceStyle} draggable={false} />,
    // wB: () => <img src="/wb_no_bg.png" alt="White bishop" style={pieceStyle} draggable={false} />,
    // wR: () => <img src="/wr_no_bg.png" alt="White rook" style={pieceStyle} draggable={false} />,
    // wQ: () => <img src="/wq_no_bg.png" alt="White queen" style={pieceStyle} draggable={false} />,
    // wK: () => <img src="/wk_no_bg.png" alt="White king" style={pieceStyle} draggable={false} />,
    // bP: () => <img src="/bp_no_bg.png" alt="Black pawn" style={pieceStyle} draggable={false} />,
    // bN: () => <img src="/bh_no_bg.png" alt="Black knight" style={pieceStyle} draggable={false} />,
    // bB: () => <img src="/bb_no_bg.png" alt="Black bishop" style={pieceStyle} draggable={false} />,
    // bR: () => <img src="/br_no_bg.png" alt="Black rook" style={pieceStyle} draggable={false} />,
    // bQ: () => <img src="/bq_no_bg.png" alt="Black queen" style={pieceStyle} draggable={false} />,
    // bK: () => <img src="/bk_no_bg.png" alt="Black king" style={pieceStyle} draggable={false} />,
  };

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
      <Chessboard
        options={{
          id: "custom-board",
          position: fen,
          onPieceDrop,
          pieces,
          boardStyle: {
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          },
          darkSquareStyle: { backgroundColor: "#3a3a52" },
          lightSquareStyle: { backgroundColor: "#e8e4d8" },
          animationDurationInMs: 200,
          showNotation: true,
        }}
      />
    </div>
  );
}