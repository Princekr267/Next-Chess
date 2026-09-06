"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";

export function CustomChessGame() {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const [turn, setTurn] = useState<"White" | "Black">(
    game.turn() === "w" ? "White" : "Black"
  );
  
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
      setTurn(game.turn() === "w" ? "White" : "Black");
      setSelectedSquare(null);
      return true;
    } catch {
      return false;
    }
  }
  function onSquareClick({ square }: { square: string }) {
    const clickedSquare = square as Square;

    if (selectedSquare) {
      try {
        const move = game.move({
          from: selectedSquare,
          to: clickedSquare,
          promotion: "q",
        });

        if (move) {
          setFen(game.fen());
          setTurn(game.turn() === "w" ? "White" : "Black");
          setSelectedSquare(null);
          return;
        }
      } catch {
        // The clicked square is not a legal destination.
      }
    }

    const piece = game.get(clickedSquare);

    if (piece && piece.color === game.turn()) {
      setSelectedSquare(clickedSquare);
    } else {
      setSelectedSquare(null);
    }
  }

  // ---- Custom piece art ----
  // Files in public/ are served from the root, so paths should not include /public
  const pieceStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    pointerEvents: "none" as const,
    display: "block",
  };

  // Wrapper handles ambient contact shadow grounding the glossy pieces on the wood
  const makePiece = (src: string, alt: string, size = "86%") =>
    function ChessPiece() {
      return (
        <div
          className="camp-piece-wrapper"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              maxWidth: size,
              maxHeight: size,
            }}
          />
        </div>
      );
    };

  const pieces = {
    wP: makePiece("/wp_no_bg.png", "White pawn", "74%"),
    wN: makePiece("/wh_no_bg.png", "White knight", "86%"),
    wK: makePiece("/wk_no_bg.png", "White king", "86%"),
    wB: makePiece("/wb_no_bg.png", "White bishop", "86%"),
    wR: makePiece("/wr_no_bg.png", "White rook", "86%"),
    wQ: makePiece("/wq_no_bg.png", "White queen", "86%"),
    bP: makePiece("/bp_no_bg.png", "Black pawn", "86%"),
    bN: makePiece("/bh_no_bg.png", "Black knight", "86%"),
    bK: makePiece("/bk_no_bg.png", "Black king", "86%"),
    bB: makePiece("/bb_no_bg.png", "Black bishop", "86%"),
    bR: makePiece("/br_no_bg.png", "Black rook", "86%"),
    bQ: makePiece("/bq_no_bg.png", "Black queen", "86%"),
  };

  function buildSquareStyles(): Record<string, React.CSSProperties> {
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

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className={`camp-badge shadow-[2px_2px_0px_#000000] text-sm px-4 py-1 ${
          turn === "White" ? "camp-badge-yellow" : "camp-badge-slate"
        }`}
        
      >
        ♟ {turn} to move
      </span>
      <div
        ref={containerRef}
        className="camp-board-tray"
        style={{
          width: "100%",
          maxWidth: 520,
          aspectRatio: "1 / 1",
          margin: "0 auto",
        }}
        // onClick={setTurn}
      >
        <Chessboard
          options={{
            id: "custom-board",
            position: fen,
            onPieceDrop,
            onSquareClick,
            squareStyles: buildSquareStyles(),
            pieces,
            boardStyle: {
              borderRadius: "6px",
              boxShadow: "inset 0 0 6px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)",
              overflow: "hidden",
              aspectRatio: "1 / 1",
            },
            darkSquareStyle: {
              backgroundColor: "#3a2b22",
              backgroundImage:
                "linear-gradient(135deg, rgba(78, 56, 45, 0.28) 0%, rgba(45, 31, 24, 0.4) 60%, rgba(26, 17, 12, 0.55) 100%)",
              boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.25)",
            },
            lightSquareStyle: {
              backgroundColor: "#dfd2bc",
              backgroundImage:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(210, 194, 168, 0.25) 50%, rgba(184, 166, 138, 0.35) 100%)",
              boxShadow: "inset 0 0 0 1px rgba(180, 158, 128, 0.3)",
            },
            dropSquareStyle: {
              boxShadow: "inset 0 0 0 3px #d97724, inset 0 0 10px rgba(217, 119, 36, 0.4)",
            },
            darkSquareNotationStyle: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              color: "rgba(223, 210, 188, 0.65)",
              fontWeight: 700,
              fontSize: "11px",
              fontFamily: "inherit",
              userSelect: "none",
            },
            lightSquareNotationStyle: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              color: "rgba(58, 43, 34, 0.75)",
              fontWeight: 700,
              fontSize: "11px",
              fontFamily: "inherit",
              userSelect: "none",
            },
            animationDurationInMs: 200,
            showNotation: true,
          }}
        />
      </div>
    </div>
  );
}