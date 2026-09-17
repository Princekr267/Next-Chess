"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { authClient } from "@/lib/auth-client";
import { Maximize2, Minimize2, History, Undo2, Redo2 } from "lucide-react";

import { customPieces } from "./chess/pieces";
import {
  buildSquareStyles,
  darkSquareStyle,
  lightSquareStyle,
  dropSquareStyle,
  getDarkNotationStyle,
  getLightNotationStyle,
} from "./chess/board-styles";
import { PlayerCard } from "./chess/PlayerCard";
import { MoveHistory } from "./chess/MoveHistory";
import { GameResultCard } from "./chess/GameResultCard";

export function CustomChessGame() {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const [turn, setTurn] = useState<"White" | "Black">(
    game.turn() === "w" ? "White" : "Black"
  );

  const { data: session } = authClient.useSession();
  const [playerOne, setPlayerOne] = useState(session?.user?.name || "Player 1");
  const [playerTwo, setPlayerTwo] = useState("Player 2");

  // NEW: The color the logged-in player is playing.
  // Locked once the first move is made to avoid mid-game confusion.
  const [loggedInPlayerColor, setLoggedInPlayerColor] = useState<"white" | "black">("white");
  const gameHasStarted = game.history().length > 0;

  // Guard so we only ever save once per finished game
  const savedRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [ratingChange, setRatingChange] = useState<{ before: number; after: number } | null>(null);
  const isRestoredRef = useRef(false);

  // Responsive & fullscreen states
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [redoStack, setRedoStack] = useState<{ from: string; to: string; promotion?: string }[]>([]);

  // Draw and Resign states
  const [manualResult, setManualResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [manualReason, setManualReason] = useState<string | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [drawOffer, setDrawOffer] = useState<"White" | "Black" | null>(null);

  // Track window resize for mobile optimizations
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Restore game state from localStorage on mount
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("next_chess_local_game") ||
        localStorage.getItem("chess_base_local_game");
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
        if (data.loggedInPlayerColor) setLoggedInPlayerColor(data.loggedInPlayerColor);
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

  // Persist game state to localStorage
  useEffect(() => {
    if (!isRestoredRef.current) return;
    try {
      localStorage.setItem(
        "next_chess_local_game",
        JSON.stringify({
          fen,
          pgn: game.pgn(),
          playerOne,
          playerTwo,
          loggedInPlayerColor,
          savedRef: savedRef.current,
        })
      );
    } catch (err) {
      console.error("Failed to persist game state:", err);
    }
  }, [fen, playerOne, playerTwo, loggedInPlayerColor, game]);

  // Sync Player 1 name when user logs in
  useEffect(() => {
    if (session?.user?.name) {
      setPlayerOne((prev) => (prev === "Player 1" || !prev ? session.user.name : prev));
    }
  }, [session?.user?.name]);

  // Fullscreen listeners
  useEffect(() => {
    function onFullscreenChange() {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        // @ts-ignore
        document.webkitFullscreenElement ||
        // @ts-ignore
        document.mozFullScreenElement ||
        // @ts-ignore
        document.msFullscreenElement
      );
      setIsFullscreen(isNowFullscreen);
      setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (!isFullscreen) {
        const el = gameWrapperRef.current;
        if (!el) return;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        } else if ((el as any).msRequestFullscreen) {
          await (el as any).msRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
          else if ((document as any).msExitFullscreen) await (document as any).msExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle fallback:", err);
      setIsFullscreen((prev) => !prev);
    } finally {
      setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    }
  }

  // ---- Result detection ----
  // Returns result from the logged-in player's perspective, or null if game isn't over.
  function getResult(): "win" | "loss" | "draw" | null {
    if (manualResult) return manualResult;
    if (!game.isGameOver()) return null;

    if (
      game.isDraw() ||
      game.isStalemate() ||
      game.isThreefoldRepetition() ||
      game.isInsufficientMaterial()
    ) {
      return "draw";
    }

    if (game.isCheckmate()) {
      // game.turn() is the side that is checkmated (no legal moves left).
      const checkmatedColor = game.turn() === "w" ? "white" : "black";
      const winnerColor = checkmatedColor === "white" ? "black" : "white";
      return winnerColor === loggedInPlayerColor ? "win" : "loss";
    }

    return "draw";
  }

  async function saveMatch(outcome?: "win" | "loss" | "draw") {
    if (savedRef.current) return; // already saved this game
    const resultToSave = outcome || getResult();
    if (!resultToSave) return; // game not over yet
    if (!session) return; // guest — nothing to save

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
          result: resultToSave,
        }),
      });

      if (!res.ok) throw new Error("Failed to save match");

      const data = await res.json();
      // capture rating change if backend returned it
      if (data.match?.ratingBefore != null && data.match?.ratingAfter != null) {
        setRatingChange({ before: data.match.ratingBefore, after: data.match.ratingAfter });
      }
      setSaveStatus("saved");
    } catch (err) {
      console.error(err);
      savedRef.current = false; // allow retry
      setSaveStatus("error");
    }
  }

  function saveMatchIfFinished() {
    saveMatch();
  }

  // ---- Resign & Draw Handlers ----
  function handleResign() {
    if (game.isGameOver() || manualResult) return;
    if (!confirmResign) {
      setConfirmResign(true);
      setTimeout(() => setConfirmResign(false), 4000);
      return;
    }
    setConfirmResign(false);

    // Current active player resigns
    const resigningColor = turn.toLowerCase() as "white" | "black";
    const winnerColor = resigningColor === "white" ? "black" : "white";
    const resigningPlayerName = resigningColor === "white" ? playerOne : playerTwo;
    const winnerPlayerName = resigningColor === "white" ? playerTwo : playerOne;

    const outcome: "win" | "loss" = winnerColor === loggedInPlayerColor ? "win" : "loss";
    const reasonText = `${resigningPlayerName} (${turn}) resigned. ${winnerPlayerName} wins!`;

    setManualResult(outcome);
    setManualReason(reasonText);
    saveMatch(outcome);
  }

  function handleOfferDraw() {
    if (game.isGameOver() || manualResult) return;
    setDrawOffer(turn);
  }

  function handleAcceptDraw() {
    if (!drawOffer) return;
    const offeringPlayer = drawOffer === "White" ? playerOne : playerTwo;
    const acceptingPlayer = drawOffer === "White" ? playerTwo : playerOne;
    setDrawOffer(null);
    setManualResult("draw");
    setManualReason(`Draw agreed mutually between ${offeringPlayer} and ${acceptingPlayer} 🤝`);
    saveMatch("draw");
  }

  function handleDeclineDraw() {
    setDrawOffer(null);
  }

  // ---- Game action handlers ----
  function resetGame() {
    game.reset();
    setFen(game.fen());
    setTurn("White");
    setSelectedSquare(null);
    savedRef.current = false;
    setSaveStatus("idle");
    setRatingChange(null);
    setConfirmReset(false);
    setManualResult(null);
    setManualReason(null);
    setConfirmResign(false);
    setDrawOffer(null);
    setRedoStack([]);
    setLoggedInPlayerColor("white"); // reset color choice for next game
    if (session?.user?.name) setPlayerOne(session.user.name);
    try {
      localStorage.removeItem("next_chess_local_game");
      localStorage.removeItem("chess_base_local_game");
    } catch {}
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

  function handleUndo() {
    if (game.history().length === 0 || !!result) return;
    const undoneMove = game.undo();
    if (undoneMove) {
      setRedoStack((prev) => [
        ...prev,
        { from: undoneMove.from, to: undoneMove.to, promotion: undoneMove.promotion },
      ]);
      setFen(game.fen());
      setTurn(game.turn() === "w" ? "White" : "Black");
      setSelectedSquare(null);
      savedRef.current = false;
      setSaveStatus("idle");
      setManualResult(null);
      setManualReason(null);
    }
  }

  function handleRedo() {
    if (redoStack.length === 0 || !!result) return;
    const nextMove = redoStack[redoStack.length - 1];
    try {
      const redone = game.move(nextMove);
      if (redone) {
        setRedoStack((prev) => prev.slice(0, -1));
        setFen(game.fen());
        setTurn(game.turn() === "w" ? "White" : "Black");
        setSelectedSquare(null);
        saveMatchIfFinished();
      }
    } catch (err) {
      console.warn("Failed to redo move:", err);
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
      setRedoStack([]); // Clear redo history on new move
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
        const move = game.move({ from: selectedSquare, to: clickedSquare, promotion: "q" });
        if (move) {
          setRedoStack([]); // Clear redo history on new move
          setFen(game.fen());
          setTurn(game.turn() === "w" ? "White" : "Black");
          setSelectedSquare(null);
          saveMatchIfFinished();
          return;
        }
      } catch {
        // Not a legal destination — fall through to piece selection below
      }
    }

    const piece = game.get(clickedSquare);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(clickedSquare);
    } else {
      setSelectedSquare(null);
    }
  }

  const result = getResult();
  const isCheck = game.inCheck() && !result;
  const moves = game.history();

  // ---- Shared board renderer ----
  const renderBoard = (style?: React.CSSProperties) => (
    <div
      ref={containerRef}
      className="camp-board-tray w-full shrink-0 touch-none select-none"
      style={{ aspectRatio: "1 / 1", margin: "0 auto", ...style }}
    >
      <Chessboard
        options={{
          id: "custom-board",
          position: fen,
          boardOrientation: loggedInPlayerColor, // NEW: flip board based on chosen color
          onPieceDrop,
          onSquareClick,
          squareStyles: buildSquareStyles(selectedSquare, game),
          pieces: customPieces,
          boardStyle: {
            borderRadius: "8px",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.6), 0 4px 18px rgba(0,0,0,0.45)",
            overflow: "hidden",
            aspectRatio: "1 / 1",
            touchAction: "none",
          },
          darkSquareStyle,
          lightSquareStyle,
          dropSquareStyle,
          darkSquareNotationStyle: getDarkNotationStyle(isMobile),
          lightSquareNotationStyle: getLightNotationStyle(isMobile),
          animationDurationInMs: 200,
          showNotation: true,
        }}
      />
    </div>
  );

  // NEW: Color picker shown above the board (only before game starts)
  const renderColorPicker = () => (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        You play as:
      </span>
      <button
        type="button"
        disabled={gameHasStarted}
        onClick={() => setLoggedInPlayerColor("white")}
        className={`camp-btn text-xs py-1 px-3 font-black shadow-[2px_2px_0px_#000000] transition-all ${
          loggedInPlayerColor === "white"
            ? "camp-btn-yellow"
            : "camp-btn-white text-gray-700 opacity-70"
        } disabled:cursor-not-allowed`}
      >
        ♙ White
      </button>
      <button
        type="button"
        disabled={gameHasStarted}
        onClick={() => setLoggedInPlayerColor("black")}
        className={`camp-btn text-xs py-1 px-3 font-black shadow-[2px_2px_0px_#000000] transition-all ${
          loggedInPlayerColor === "black"
            ? "camp-btn-slate"
            : "camp-btn-white text-gray-700 opacity-70"
        } disabled:cursor-not-allowed`}
      >
        ♟ Black
      </button>
      {gameHasStarted && (
        <span className="text-[10px] text-slate-500 italic">(locked after first move)</span>
      )}
    </div>
  );

  // Draw Offer Confirmation Modal
  const renderDrawOfferModal = () => {
    if (!drawOffer) return null;
    const offeringPlayer = drawOffer === "White" ? playerOne : playerTwo;
    return (
      <div
        className="fixed inset-x-4 top-20 sm:top-24 max-w-sm mx-auto z-50 camp-card-canvas p-4 text-center animate-in zoom-in-95 duration-150"
        style={{
          boxShadow:
            "0 12px 36px rgba(0,0,0,0.6), inset -3px -3px 8px rgba(0,0,0,0.1), inset 3px 3px 8px rgba(255,255,255,0.7)",
        }}
      >
        <div className="text-2xl mb-1">🤝</div>
        <h4 className="text-base font-black text-gray-900 mb-1">Draw Offered</h4>
        <p className="text-xs text-gray-600 mb-3 font-medium">
          <strong>{offeringPlayer}</strong> ({drawOffer}) offers a mutual draw. Do you accept?
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleAcceptDraw}
            className="camp-btn camp-btn-yellow text-xs py-1.5 px-4 font-black shadow-[1px_1px_0px_#000]"
          >
            Accept Draw
          </button>
          <button
            type="button"
            onClick={handleDeclineDraw}
            className="camp-btn camp-btn-slate text-xs py-1.5 px-4 font-black shadow-[1px_1px_0px_#000]"
          >
            Decline
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 1. MOBILE FULLSCREEN VIEW
  // =========================================================================
  if (isFullscreen && isMobile) {
    return (
      <div
        ref={gameWrapperRef}
        className="fixed inset-0 z-50 bg-[#1c1208] p-2 flex flex-col justify-between items-center w-full h-[100svh] overflow-hidden select-none touch-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(67, 52, 30, 0.45) 0%, rgba(24, 14, 6, 0.95) 100%)",
        }}
      >
        {/* Top: Opponent Info & Controls */}
        <div className="w-full flex items-center justify-between gap-2 px-1 py-1">
          <div className="min-w-0 flex-1">
            <PlayerCard
              color="black"
              name={playerTwo}
              onNameChange={setPlayerTwo}
              isTurn={turn === "Black"}
              isCompact
              inputId="opponent-mobile-fs"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`camp-badge text-[11px] px-2.5 py-1 ${
                turn === "White" ? "camp-badge-yellow" : "camp-badge-slate"
              }`}
            >
              ♟ {turn}
            </span>
            {isCheck && (
              <span className="camp-badge camp-badge-red text-[10px] px-2 py-0.5 animate-bounce">
                Check!
              </span>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="camp-btn camp-btn-white text-xs p-1.5 font-black text-stone-900 hover:scale-105 active:scale-95 transition-all"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 flex items-center justify-center w-full my-auto overflow-hidden">
          {renderBoard({ width: "min(98vw, calc(100svh - 150px), 520px)", maxWidth: "100%" })}
        </div>

        {/* Bottom: Player Info & Actions */}
        <div className="w-full flex flex-col gap-1.5 px-1 py-1">
          <div className="w-full flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <PlayerCard
                color="white"
                name={playerOne}
                onNameChange={setPlayerOne}
                isTurn={turn === "White"}
                isCompact
                inputId="you-mobile-fs"
              />
            </div>
          </div>

          {/* Action Row on Mobile Fullscreen */}
          <div className="flex items-center gap-1.5 justify-between">
            <button
              type="button"
              onClick={handleUndo}
              disabled={moves.length === 0 || !!result}
              className="camp-btn camp-btn-slate text-xs py-1.5 px-2 font-black flex items-center gap-1 disabled:opacity-40"
              title="Undo move"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0 || !!result}
              className="camp-btn camp-btn-slate text-xs py-1.5 px-2 font-black flex items-center gap-1 disabled:opacity-40"
              title="Redo move"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>Redo</span>
            </button>

            {gameHasStarted && !result && (
              <>
                <button
                  type="button"
                  onClick={handleOfferDraw}
                  className="camp-btn camp-btn-slate text-xs py-1.5 px-2.5 font-black flex items-center gap-1 hover:scale-105 active:scale-95 transition-all"
                  title="Offer mutual draw"
                >
                  <span>🤝</span>
                  <span>Draw</span>
                </button>

                <button
                  type="button"
                  onClick={handleResign}
                  className={`camp-btn text-xs py-1.5 px-2.5 font-black flex items-center gap-1 hover:scale-105 active:scale-95 transition-all ${
                    confirmResign ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-slate"
                  }`}
                  title="Resign game"
                >
                  <span>🏳️</span>
                  <span>{confirmResign ? "Confirm?" : "Resign"}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowMobileHistory((prev) => !prev)}
              className="camp-btn camp-btn-slate text-xs py-1.5 px-2.5 font-black flex items-center gap-1 hover:scale-105 active:scale-95 transition-all"
              title="View moves"
            >
              <History className="w-3.5 h-3.5" />
              <span>{moves.length}</span>
            </button>

            <button
              type="button"
              onClick={handleNewGame}
              className={`camp-btn text-xs py-1.5 px-3 font-black flex items-center gap-1 hover:scale-105 active:scale-95 transition-all ${
                confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
              }`}
            >
              <span>↺</span>
              <span>{confirmReset ? "Reset?" : "New"}</span>
            </button>
          </div>
        </div>

        {renderDrawOfferModal()}

        {showMobileHistory && (
          <MoveHistory
            moves={moves}
            isMobileDrawer
            onCloseDrawer={() => setShowMobileHistory(false)}
          />
        )}

        <GameResultCard
          result={result}
          reason={manualReason}
          session={session}
          saveStatus={saveStatus}
          onPlayAgain={resetGame}
          ratingChange={ratingChange}
          isOverlay
        />
      </div>
    );
  }

  // =========================================================================
  // 2. DESKTOP FULLSCREEN ARENA
  // =========================================================================
  if (isFullscreen && !isMobile) {
    return (
      <div
        ref={gameWrapperRef}
        className="fixed inset-0 z-50 bg-[#191007] p-4 sm:p-6 lg:p-8 flex flex-row items-center justify-center gap-8 lg:gap-10 overflow-y-auto w-full min-h-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(67, 52, 30, 0.4) 0%, rgba(20, 12, 5, 0.98) 100%)",
        }}
      >
        {/* Left: Massive Board */}
        <div className="flex flex-col items-center gap-3">
          <PlayerCard
            color="black"
            name={playerTwo}
            onNameChange={setPlayerTwo}
            isTurn={turn === "Black"}
            inputId="opponent-fs"
            className="max-w-[min(90vh,calc(100vw-420px),820px)]"
          />

          {renderBoard({ width: "min(84vh, calc(100vw - 420px), 820px)", maxWidth: "100%" })}

          <PlayerCard
            color="white"
            name={playerOne}
            onNameChange={setPlayerOne}
            isTurn={turn === "White"}
            inputId="you-fs"
            className="max-w-[min(90vh,calc(100vw-420px),820px)]"
          />
        </div>

        {/* Right: Side Dashboard */}
        <div className="w-84 lg:w-96 flex flex-col gap-4 shrink-0 max-h-[92vh] justify-between">
          {/* Status & Exit */}
          <div className="rounded-2xl p-4 bg-[#261a0e]/95 border border-[#48331d]/60 flex flex-col gap-3"
            style={{
              boxShadow: "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-200/60">
                Theater Arena
              </span>
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Exit Fullscreen (Esc)"
                className="camp-btn camp-btn-white text-xs py-1 px-3 font-black flex items-center gap-1.5 text-stone-950 hover:scale-105 active:scale-95 transition-all"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Arena</span>
              </button>
            </div>

            {/* Turn Banner */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181008] border border-amber-950">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black ${
                    turn === "White"
                      ? "bg-amber-300 text-amber-950"
                      : "bg-[#100a05] text-amber-100 border border-amber-900/50"
                  }`}
                >
                  {turn === "White" ? "♙" : "♟"}
                </div>
                <div>
                  <div className="text-sm font-black text-amber-100">
                    {turn}&apos;s Turn
                  </div>
                  <div className="text-[11px] font-medium text-amber-300/70">
                    {turn === "White" ? playerOne : playerTwo} to move
                  </div>
                </div>
              </div>

              {isCheck && (
                <span className="camp-badge camp-badge-red text-xs px-2.5 py-1 animate-bounce">
                  ⚠️ Check!
                </span>
              )}
            </div>

            {/* Color Picker (only before game starts) */}
            {!gameHasStarted && (
              <div className="pt-1 border-t border-amber-950/60">
                {renderColorPicker()}
              </div>
            )}
          </div>

          {/* Move Notation Log */}
          <MoveHistory moves={moves} className="flex-1 min-h-[220px]" />

          {/* Action Buttons Panel */}
          <div
            className="rounded-2xl p-3.5 bg-[#261a0e]/95 border border-[#48331d]/60 flex flex-col gap-2.5"
            style={{
              boxShadow: "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={moves.length === 0 || !!result}
                className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
                title="Undo last move"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo Move</span>
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0 || !!result}
                className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
                title="Redo move"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo Move</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOfferDraw}
                disabled={!gameHasStarted || !!result}
                className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
                title="Offer mutual draw"
              >
                <span>🤝</span>
                <span>Offer Draw</span>
              </button>

              <button
                type="button"
                onClick={handleResign}
                disabled={!gameHasStarted || !!result}
                className={`camp-btn text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all ${
                  confirmResign ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-slate"
                }`}
                title="Resign game"
              >
                <span>🏳️</span>
                <span>{confirmResign ? "Confirm Resign?" : "Resign"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNewGame}
              className={`camp-btn w-full text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 transition-all ${
                confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
              }`}
            >
              <span>↺</span>
              <span>{confirmReset ? "Reset?" : "New Game"}</span>
            </button>
          </div>

          <GameResultCard
            result={result}
            reason={manualReason}
            session={session}
            saveStatus={saveStatus}
            onPlayAgain={resetGame}
            ratingChange={ratingChange}
          />
        </div>

        {renderDrawOfferModal()}
      </div>
    );
  }

  // =========================================================================
  // 3. RESPONSIVE PLAY ARENA (Desktop 2-Column + Mobile Single-Column)
  // =========================================================================
  return (
    <div
      ref={gameWrapperRef}
      className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8 transition-all"
    >
      {/* LEFT COLUMN: Chess Board Arena */}
      <div className="flex flex-col items-center gap-2.5 w-full max-w-[min(98vw,560px)] shrink-0">
        {/* Opponent (Black) Card */}
        <PlayerCard
          color="black"
          name={playerTwo}
          onNameChange={setPlayerTwo}
          isTurn={turn === "Black"}
          inputId="opponent"
        />

        {/* Board Tray */}
        {renderBoard({ maxWidth: "min(98vw, 560px)" })}

        {/* Player (White / You) Card */}
        <PlayerCard
          color="white"
          name={playerOne}
          onNameChange={setPlayerOne}
          isTurn={turn === "White"}
          inputId="you"
        />

        {/* Mobile-Only Controls Bar (hidden on desktop lg) */}
        <div className="w-full lg:hidden flex flex-col gap-2.5 pt-1">
          {/* Turn status + Check + Moves drawer trigger */}
          <div className="w-full flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`camp-badge text-xs px-3 py-1 ${
                  turn === "White" ? "camp-badge-yellow" : "camp-badge-slate"
                }`}
              >
                ♟ {turn} to move
              </span>
              {isCheck && (
                <span className="camp-badge camp-badge-red text-xs px-2.5 py-1 animate-bounce">
                  ⚠️ Check!
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowMobileHistory(true)}
              className="camp-btn camp-btn-slate text-xs py-1.5 px-3 font-black flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>Moves ({moves.length})</span>
            </button>
          </div>

          {/* Color picker on mobile before game starts */}
          {!gameHasStarted && (
            <div className="py-1">{renderColorPicker()}</div>
          )}

          {/* Mobile Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={moves.length === 0 || !!result}
              className="camp-btn camp-btn-slate text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
              title="Undo last move"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0 || !!result}
              className="camp-btn camp-btn-slate text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
              title="Redo move"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>Redo</span>
            </button>

            <button
              type="button"
              onClick={handleOfferDraw}
              disabled={!gameHasStarted || !!result}
              className="camp-btn camp-btn-slate text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
              title="Offer mutual draw"
            >
              <span>🤝</span>
              <span>Draw</span>
            </button>

            <button
              type="button"
              onClick={handleResign}
              disabled={!gameHasStarted || !!result}
              className={`camp-btn text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all ${
                confirmResign ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-slate"
              }`}
              title="Resign game"
            >
              <span>🏳️</span>
              <span>{confirmResign ? "Confirm?" : "Resign"}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="camp-btn camp-btn-white text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 text-stone-900"
              title="Full Arena View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={handleNewGame}
              className={`camp-btn text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 ${
                confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
              }`}
            >
              <span>↺</span>
              <span>{confirmReset ? "Reset?" : "New Game"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {showMobileHistory && (
          <MoveHistory
            moves={moves}
            isMobileDrawer
            onCloseDrawer={() => setShowMobileHistory(false)}
          />
        )}
      </div>

      {/* RIGHT COLUMN: Desktop Game Dashboard & Console (Visible on lg and up) */}
      <div className="hidden lg:flex flex-col gap-3.5 w-80 xl:w-96 shrink-0">
        {/* 1. Turn & Match Status Card */}
        <div
          className="rounded-2xl p-4 bg-[#261a0e]/95 border border-[#48331d]/60 flex flex-col gap-3"
          style={{
            boxShadow:
              "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-200/60">
              Match Console
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-900/40 text-amber-300">
              Local Pass &amp; Play
            </span>
          </div>

          {/* Active Turn Banner */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181008] border border-amber-950">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black ${
                  turn === "White"
                    ? "bg-amber-300 text-amber-950"
                    : "bg-[#100a05] text-amber-100 border border-amber-900/50"
                }`}
                style={{
                  boxShadow:
                    turn === "White"
                      ? "2px 2px 6px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(180,120,30,0.3), inset 2px 2px 4px rgba(255,255,255,0.7)"
                      : "2px 2px 6px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,210,130,0.15)",
                }}
              >
                {turn === "White" ? "♙" : "♟"}
              </div>
              <div>
                <div className="text-sm font-black text-amber-100">
                  {turn}&apos;s Turn
                </div>
                <div className="text-[11px] font-medium text-amber-300/70">
                  {turn === "White" ? playerOne : playerTwo} to move
                </div>
              </div>
            </div>

            {isCheck && (
              <span className="camp-badge camp-badge-red text-xs px-2.5 py-1 animate-bounce">
                ⚠️ Check!
              </span>
            )}
          </div>

          {/* Pre-game Color Choice */}
          {!gameHasStarted && (
            <div className="pt-2 border-t border-amber-950/60">
              {renderColorPicker()}
            </div>
          )}
        </div>

        {/* 2. Live Move History Notation Log */}
        <MoveHistory moves={moves} className="min-h-[220px] max-h-[300px]" />

        {/* 3. Game Control Actions Panel */}
        <div
          className="rounded-2xl p-4 bg-[#261a0e]/95 border border-[#48331d]/60 flex flex-col gap-3"
          style={{
            boxShadow:
              "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
          }}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-200/60 px-0.5">
            Actions
          </div>

          <div className="flex flex-col gap-2">
            {/* Row 1: Undo and Redo */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={moves.length === 0 || !!result}
                className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-2 disabled:opacity-40"
                title="Undo last move"
              >
                <Undo2 className="w-4 h-4" />
                <span>Undo Move</span>
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0 || !!result}
                className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-2 disabled:opacity-40"
                title="Redo move"
              >
                <Redo2 className="w-4 h-4" />
                <span>Redo Move</span>
              </button>
            </div>

            {/* Row 2: Draw and Resign */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleOfferDraw}
                disabled={!gameHasStarted || !!result}
                className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-2 disabled:opacity-40"
                title="Offer a mutual draw to opponent"
              >
                <span>🤝</span>
                <span>Offer Draw</span>
              </button>

              <button
                type="button"
                onClick={handleResign}
                disabled={!gameHasStarted || !!result}
                className={`camp-btn text-xs py-2.5 px-3 font-black flex items-center justify-center gap-2 disabled:opacity-40 transition-all ${
                  confirmResign
                    ? "camp-btn-red bg-rose-500 text-white animate-pulse"
                    : "camp-btn-slate"
                }`}
                title="Resign the match"
              >
                <span>🏳️</span>
                <span>{confirmResign ? "Confirm Resign?" : "Resign"}</span>
              </button>
            </div>

            {/* Row 3: Fullscreen and New Game */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="camp-btn camp-btn-white text-xs py-2.5 px-3 font-black flex items-center justify-center gap-2 text-stone-900"
                title="Play in Theater Fullscreen Arena"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Fullscreen</span>
              </button>

              <button
                type="button"
                onClick={handleNewGame}
                className={`camp-btn text-xs py-2.5 px-3 font-black flex items-center justify-center gap-2 transition-all ${
                  confirmReset
                    ? "camp-btn-red bg-rose-500 text-white animate-pulse"
                    : "camp-btn-yellow"
                }`}
              >
                <span>↺</span>
                <span>{confirmReset ? "Reset Board?" : "New Game"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Match Outcome Result Card (Desktop) */}
        <GameResultCard
          result={result}
          reason={manualReason}
          session={session}
          saveStatus={saveStatus}
          onPlayAgain={resetGame}
          ratingChange={ratingChange}
        />
      </div>

      {/* Draw Offer Modal */}
      {renderDrawOfferModal()}

      {/* Game Result Card on Mobile (< lg) */}
      <div className="w-full max-w-[min(98vw,560px)] lg:hidden">
        <GameResultCard
          result={result}
          reason={manualReason}
          session={session}
          saveStatus={saveStatus}
          onPlayAgain={resetGame}
          ratingChange={ratingChange}
        />
      </div>
    </div>
  );
}