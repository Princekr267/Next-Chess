"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { authClient } from "@/lib/auth-client";
import { Maximize2, Minimize2, History, Undo2 } from "lucide-react";

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

  // The logged-in user always plays White in local pass-and-play
  const loggedInPlayerColor: "white" | "black" = "white";

  const [turn, setTurn] = useState<"White" | "Black">(
    game.turn() === "w" ? "White" : "Black"
  );

  const { data: session } = authClient.useSession();
  const [playerOne, setPlayerOne] = useState(session?.user?.name || "Player 1");
  const [playerTwo, setPlayerTwo] = useState("Player 2");

  // Guard so we only ever save once per finished game
  const savedRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isRestoredRef = useRef(false);

  // Responsive & fullscreen states
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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
      const saved = localStorage.getItem("next_chess_local_game") || localStorage.getItem("chess_base_local_game");
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
          savedRef: savedRef.current,
        })
      );
    } catch (err) {
      console.error("Failed to persist game state:", err);
    }
  }, [fen, playerOne, playerTwo, game]);

  // Sync Player 1 when user logs in
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
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
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
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle fallback:", err);
      setIsFullscreen((prev) => !prev);
    } finally {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  }

  // Result detection
  function getResult(): "win" | "loss" | "draw" | null {
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
      const checkmatedColor = game.turn() === "w" ? "white" : "black";
      const winnerColor = checkmatedColor === "white" ? "black" : "white";
      return winnerColor === loggedInPlayerColor ? "win" : "loss";
    }

    return "draw";
  }

  async function saveMatchIfFinished() {
    if (savedRef.current) return;
    const result = getResult();
    if (!result || !session) return;

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
      savedRef.current = false;
      setSaveStatus("error");
    }
  }

  // Game action handlers
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
    if (game.history().length === 0) return;
    const undoneMove = game.undo();
    if (undoneMove) {
      setFen(game.fen());
      setTurn(game.turn() === "w" ? "White" : "Black");
      setSelectedSquare(null);
      savedRef.current = false;
      setSaveStatus("idle");
    }
  }

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
      } catch {}
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

  // Unified board renderer
  const renderBoard = (style?: React.CSSProperties) => (
    <div
      ref={containerRef}
      className="camp-board-tray w-full shrink-0 touch-none select-none"
      style={{
        aspectRatio: "1 / 1",
        margin: "0 auto",
        ...style,
      }}
    >
      <Chessboard
        options={{
          id: "custom-board",
          position: fen,
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

  // =========================================================================
  // 1. MOBILE FULLSCREEN VIEW (Edge-to-edge board, compact bars, no scroll)
  // =========================================================================
  if (isFullscreen && isMobile) {
    return (
      <div
        ref={gameWrapperRef}
        className="fixed inset-0 z-50 bg-[#070b14] p-2 flex flex-col justify-between items-center w-full h-[100svh] overflow-hidden select-none touch-none"
      >
        {/* Top Header: Opponent Info & Controls */}
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
              className={`camp-badge text-[10px] px-2 py-0.5 shadow-[1px_1px_0px_#000000] ${
                turn === "White" ? "camp-badge-yellow" : "camp-badge-slate"
              }`}
            >
              ♟ {turn}
            </span>
            {isCheck && (
              <span className="camp-badge camp-badge-red text-[10px] px-1.5 py-0.5 animate-bounce shadow-[1px_1px_0px_#000000]">
                Check!
              </span>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="camp-btn camp-btn-white text-xs p-1.5 font-black shadow-[1px_1px_0px_#000000] text-black hover:scale-105 active:scale-95 transition-all"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Massive Chessboard Centered on Mobile */}
        <div className="flex-1 flex items-center justify-center w-full my-auto overflow-hidden">
          {renderBoard({
            width: "min(98vw, calc(100svh - 150px), 520px)",
            maxWidth: "100%",
          })}
        </div>

        {/* Bottom Footer: Player Info & Actions */}
        <div className="w-full flex items-center justify-between gap-2 px-1 py-1">
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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={moves.length === 0}
              className="camp-btn camp-btn-slate text-[11px] py-1 px-2 font-bold shadow-[1px_1px_0px_#000000] flex items-center gap-1 disabled:opacity-40"
              title="Undo move"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowMobileHistory((prev) => !prev)}
              className="camp-btn camp-btn-slate text-[11px] py-1 px-2 font-bold shadow-[1px_1px_0px_#000000] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all"
              title="View moves"
            >
              <History className="w-3.5 h-3.5" />
              <span>{moves.length}</span>
            </button>

            <button
              type="button"
              onClick={handleNewGame}
              className={`camp-btn text-[11px] py-1 px-2.5 font-black shadow-[1px_1px_0px_#000000] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all ${
                confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
              }`}
            >
              <span>↺</span>
              <span>{confirmReset ? "Reset?" : "New"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Move History Popover Drawer */}
        {showMobileHistory && (
          <MoveHistory
            moves={moves}
            isMobileDrawer
            onCloseDrawer={() => setShowMobileHistory(false)}
          />
        )}

        {/* Mobile Result Overlay Banner */}
        <GameResultCard
          result={result}
          session={session}
          saveStatus={saveStatus}
          onPlayAgain={resetGame}
          isOverlay
        />
      </div>
    );
  }

  // =========================================================================
  // 2. DESKTOP FULLSCREEN ARENA (Maximized board + Dedicated side dashboard)
  // =========================================================================
  if (isFullscreen && !isMobile) {
    return (
      <div
        ref={gameWrapperRef}
        className="fixed inset-0 z-50 bg-[#070b14] p-3 sm:p-5 md:p-6 flex flex-row items-center justify-center gap-6 lg:gap-8 overflow-y-auto w-full min-h-screen"
      >
        {/* Massive Chessboard Centerpiece */}
        {renderBoard({
          width: "min(92vh, calc(100vw - 380px), 860px)",
          maxWidth: "100%",
        })}

        {/* Side Control & Information Dashboard */}
        <div className="w-80 lg:w-96 flex flex-col gap-3 shrink-0 max-h-[92vh] justify-between">
          {/* Top Status & Exit Bar */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span
                className={`camp-badge shadow-[2px_2px_0px_#000000] text-xs sm:text-sm px-3 py-1 ${
                  turn === "White" ? "camp-badge-yellow" : "camp-badge-slate"
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
              onClick={toggleFullscreen}
              title="Exit Fullscreen (Esc)"
              className="camp-btn camp-btn-white text-xs py-1.5 px-3 font-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 text-black hover:scale-105 active:scale-95 transition-all"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>

          {/* Black (Opponent) Card */}
          <PlayerCard
            color="black"
            name={playerTwo}
            onNameChange={setPlayerTwo}
            isTurn={turn === "Black"}
            inputId="opponent-fs"
          />

          {/* Tactical Move History Log */}
          <MoveHistory moves={moves} />

          {/* White (You) Card */}
          <PlayerCard
            color="white"
            name={playerOne}
            onNameChange={setPlayerOne}
            isTurn={turn === "White"}
            inputId="you-fs"
          />

          {/* Actions: Undo & Reset Game */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={moves.length === 0}
              className="camp-btn camp-btn-slate text-xs py-2 px-3.5 font-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 disabled:opacity-40"
              title="Undo last move"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={handleNewGame}
              className={`camp-btn flex-1 text-xs py-2 px-3 font-black shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all ${
                confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
              }`}
            >
              <span>↺</span>
              <span>{confirmReset ? "Confirm Reset Game?" : "New Game"}</span>
            </button>
          </div>

          {/* Result card if finished */}
          <GameResultCard
            result={result}
            session={session}
            saveStatus={saveStatus}
            onPlayAgain={resetGame}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. NORMAL COMPACT VIEW (Mobile & Desktop, Max 520px)
  // =========================================================================
  return (
    <div
      ref={gameWrapperRef}
      className="flex flex-col items-center gap-2.5 sm:gap-3 w-full max-w-[min(98vw,520px)] mx-auto transition-all"
    >
      {/* Top Status and Actions Bar */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 px-1">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span
            className={`camp-badge shadow-[2px_2px_0px_#000000] text-[11px] sm:text-sm px-2.5 sm:px-4 py-1 ${
              turn === "White" ? "camp-badge-yellow" : "camp-badge-slate"
            }`}
          >
            ♟ {turn} to move
          </span>
          {isCheck && (
            <span className="camp-badge camp-badge-red shadow-[2px_2px_0px_#000000] text-[11px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 animate-bounce">
              ⚠️ Check!
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={moves.length === 0}
            title="Undo move"
            className="camp-btn camp-btn-slate text-xs py-1 px-2 sm:py-1.5 sm:px-2.5 font-black shadow-[2px_2px_0px_#000000] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Play Fullscreen"
            className="camp-btn camp-btn-white text-xs py-1 px-2 sm:py-1.5 sm:px-2.5 font-black shadow-[2px_2px_0px_#000000] flex items-center gap-1 sm:gap-1.5 hover:scale-105 active:scale-95 transition-all text-black"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Fullscreen</span>
          </button>

          <button
            type="button"
            onClick={handleNewGame}
            title="Start a new game (resets board)"
            className={`camp-btn text-xs py-1 px-2.5 sm:py-1.5 sm:px-3 font-black shadow-[2px_2px_0px_#000000] flex items-center gap-1 sm:gap-1.5 hover:scale-105 active:scale-95 transition-all ${
              confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
            }`}
          >
            <span>↺</span>
            <span>{confirmReset ? "Reset?" : "New"}</span>
          </button>
        </div>
      </div>

      {/* Result notification */}
      <GameResultCard
        result={result}
        session={session}
        saveStatus={saveStatus}
        onPlayAgain={resetGame}
      />

      {/* Opponent (Black) Card */}
      <PlayerCard
        color="black"
        name={playerTwo}
        onNameChange={setPlayerTwo}
        isTurn={turn === "Black"}
        inputId="opponent"
      />

      {/* Board Tray */}
      {renderBoard({ maxWidth: "min(98vw, 520px)" })}

      {/* Player (White / You) Card */}
      <PlayerCard
        color="white"
        name={playerOne}
        onNameChange={setPlayerOne}
        isTurn={turn === "White"}
        inputId="you"
      />
    </div>
  );
}
