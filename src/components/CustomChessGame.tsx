"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { authClient } from "@/lib/auth-client";

export function CustomChessGame() {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // The logged-in user always plays White in local pass-and-play, matching
  // the "You" input below the board. Adjust here if you later add color choice.
  const loggedInPlayerColor: "white" | "black" = "white";

  const [turn, setTurn] = useState<"White" | "Black">(
    game.turn() === "w" ? "White" : "Black"
  );

  const { data: session } = authClient.useSession();

  const [playerOne, setPlayerOne] = useState(session?.user?.name || "Player 1");
  const [playerTwo, setPlayerTwo] = useState("Player 2");

  // Guard so we only ever save once per finished game, even if state updates twice
  const savedRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isRestoredRef = useRef(false);

  // Restore game state from localStorage on mount so tab switching/reloads never lose the game
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chess_base_local_game");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.pgn) {
          try {
            game.loadPgn(data.pgn);
          } catch {
            if (data.fen) game.load(data.fen);
          }
        } else if (data.fen) {
          game.load(data.fen);
        }
        setFen(game.fen());
        setTurn(game.turn() === "w" ? "White" : "Black");
        if (data.playerOne && data.playerOne !== "Player 1") {
          setPlayerOne(data.playerOne);
        } else if (session?.user?.name) {
          setPlayerOne(session.user.name);
        }
        if (data.playerTwo) setPlayerTwo(data.playerTwo);
        if (typeof data.savedRef === "boolean") savedRef.current = data.savedRef;
      } else if (session?.user?.name) {
        setPlayerOne(session.user.name);
      }
    } catch (err) {
      console.error("Failed to restore game from localStorage:", err);
    } finally {
      isRestoredRef.current = true;
    }
  }, [game, session?.user?.name]);

  // Persist game state to localStorage whenever moves or player names change
  useEffect(() => {
    if (!isRestoredRef.current) return;
    try {
      localStorage.setItem(
        "chess_base_local_game",
        JSON.stringify({
          fen,
          pgn: game.pgn(),
          playerOne,
          playerTwo,
          savedRef: savedRef.current,
        })
      );
    } catch (err) {
      console.error("Failed to persist game state:", err);
    }
  }, [fen, playerOne, playerTwo, game]);

  // Automatically update Player 1 to signed in user's name when session loads
  useEffect(() => {
    if (session?.user?.name) {
      setPlayerOne((prev) => (prev === "Player 1" || !prev ? session.user.name : prev));
    }
  }, [session?.user?.name]);

  const [confirmReset, setConfirmReset] = useState(false);

  function resetGame() {
    game.reset();
    setFen(game.fen());
    setTurn("White");
    setSelectedSquare(null);
    savedRef.current = false;
    setSaveStatus("idle");
    setConfirmReset(false);
    if (session?.user?.name) {
      setPlayerOne(session.user.name);
    }
    try {
      localStorage.removeItem("chess_base_local_game");
    } catch { }
  }

  function handleNewGame() {
    if (game.history().length === 0 || game.isGameOver()) {
      resetGame();
      return;
    }
    if (confirmReset) {
      resetGame();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    }
  }

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

  // ---- Result detection ----
  // Returns the result from the logged-in player's perspective, or null if the game isn't over.
  function getResult(): "win" | "loss" | "draw" | null {
    if (!game.isGameOver()) return null;

    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
      return "draw";
    }

    if (game.isCheckmate()) {
      // game.turn() is the side that is checkmated (they have no legal move).
      // So the winner is the OTHER color.
      const checkmatedColor = game.turn() === "w" ? "white" : "black";
      const winnerColor = checkmatedColor === "white" ? "black" : "white";
      return winnerColor === loggedInPlayerColor ? "win" : "loss";
    }

    // Fallback for any other game-over condition chess.js might report
    return "draw";
  }

  async function saveMatchIfFinished() {
    if (savedRef.current) return; // already saved this game
    const result = getResult();
    if (!result) return; // game not over yet
    if (!session) return; // guest — nothing to save against

    savedRef.current = true;
    setSaveStatus("saving");

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentType: "local",
          botDifficulty: null,
          playerColor: loggedInPlayerColor,
          player2Name: playerTwo,
          result,
        }),
      });

      if (!res.ok) throw new Error("Failed to save match");
      setSaveStatus("saved");
    } catch (err) {
      console.error(err);
      savedRef.current = false; // allow retry
      setSaveStatus("error");
    }
  }

  // ---- Move handling ----
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
      saveMatchIfFinished();
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
          saveMatchIfFinished();
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
  const pieceStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    pointerEvents: "none" as const,
    display: "block",
  };

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

  const result = getResult();
  const isCheck = game.inCheck() && !result;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[520px] mx-auto">
      {/* Top Status and Actions Bar */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className={`camp-badge shadow-[2px_2px_0px_#000000] text-xs sm:text-sm px-3 sm:px-4 py-1 ${turn === "White" ? "camp-badge-yellow" : "camp-badge-slate"
              }`}
          >
            ♟ {turn} to move
          </span>
          {isCheck && (
            <span className="camp-badge camp-badge-red shadow-[2px_2px_0px_#000000] text-xs px-2.5 py-1 animate-bounce">
              ⚠️ Check!
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleNewGame}
          title="Start a new game (resets board)"
          className={`camp-btn text-xs py-1.5 px-3 font-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all ${confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
            }`}
        >
          <span>↺</span>
          <span>{confirmReset ? "Confirm Reset?" : "New Game"}</span>
        </button>
      </div>

      {result && (
        <div className="camp-card-canvas w-full px-4 py-3 text-sm font-black text-center shadow-[4px_4px_0px_#000000] border-[2.5px] border-black">
          <div className="text-base sm:text-lg">
            {result === "draw" ? "Game drawn." : result === "win" ? "You won! 🎉" : "You lost."}
          </div>
          {!session && (
            <p className="text-xs font-medium text-gray-600 mt-1">
              Sign in to save match results to your history.
            </p>
          )}
          {session && saveStatus === "saving" && (
            <p className="text-xs font-medium text-gray-600 mt-1">Saving match…</p>
          )}
          {session && saveStatus === "saved" && (
            <p className="text-xs font-medium text-emerald-700 mt-1">Saved to your match history.</p>
          )}
          {session && saveStatus === "error" && (
            <p className="text-xs font-medium text-red-600 mt-1">Couldn't save match — try again.</p>
          )}

          <button
            type="button"
            onClick={resetGame}
            className="mt-3 camp-btn camp-btn-ember text-xs py-1.5 px-4 font-black shadow-[2px_2px_0px_#000000]"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Opponent (Black) Card */}
      <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border-[2px] border-black shadow-[3px_3px_0px_#000000]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-xs text-white font-black shadow-[1px_1px_0px_#000]">
            ♟
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="opponent" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Black:
            </label>
            <input
              id="opponent"
              type="text"
              value={playerTwo}
              onChange={(e) => setPlayerTwo(e.target.value)}
              className="bg-black/60 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 transition-colors w-32 sm:w-44"
            />
          </div>
        </div>
        {turn === "Black" && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-700 text-amber-300 px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] animate-pulse">
            To Move
          </span>
        )}
      </div>

      {/* Board Tray */}
      <div
        ref={containerRef}
        className="camp-board-tray w-full"
        style={{
          aspectRatio: "1 / 1",
          margin: "0 auto",
        }}
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

      {/* Player (White / You) Card */}
      <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border-[2px] border-black shadow-[3px_3px_0px_#000000]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-400 border border-black flex items-center justify-center text-xs text-black font-black shadow-[1px_1px_0px_#000]">
            ♙
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="you" className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">
              White (You):
            </label>
            <input
              id="you"
              type="text"
              value={playerOne}
              onChange={(e) => setPlayerOne(e.target.value)}
              className="bg-black/60 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 transition-colors w-32 sm:w-44"
            />
          </div>
        </div>
        {turn === "White" && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] animate-pulse">
            Your Turn
          </span>
        )}
      </div>
    </div>
  );
}
