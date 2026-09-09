"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { authClient } from "@/lib/auth-client";
import { Maximize2, Minimize2, History, X } from "lucide-react";

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

  // ---- Fullscreen & Responsive Handling ----
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      // Trigger a window resize so react-chessboard recalculates its dimensions smoothly
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
      console.warn("Native fullscreen toggle failed, using CSS fallback:", err);
      setIsFullscreen((prev) => !prev);
    } finally {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
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
    touchAction: "none" as const,
    userSelect: "none" as const,
    WebkitUserSelect: "none" as const,
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

  const moves = game.history();
  const movePairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

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
          squareStyles: buildSquareStyles(),
          pieces,
          boardStyle: {
            borderRadius: "8px",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.6), 0 4px 18px rgba(0,0,0,0.45)",
            overflow: "hidden",
            aspectRatio: "1 / 1",
            touchAction: "none",
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
            fontSize: isMobile ? "9px" : "11px",
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
            fontSize: isMobile ? "9px" : "11px",
            fontFamily: "inherit",
            userSelect: "none",
          },
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
        {/* Top Header: Opponent Info & Quick Controls */}
        <div className="w-full flex items-center justify-between gap-2 px-1 py-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-xs text-white font-black shadow-[1px_1px_0px_#000] shrink-0">
              ♟
            </div>
            <input
              id="opponent-mobile-fs"
              type="text"
              value={playerTwo}
              onChange={(e) => setPlayerTwo(e.target.value)}
              className="bg-black/60 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 w-24 xs:w-32 truncate"
              placeholder="Opponent"
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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-amber-400 border border-black flex items-center justify-center text-xs text-black font-black shadow-[1px_1px_0px_#000] shrink-0">
              ♙
            </div>
            <input
              id="you-mobile-fs"
              type="text"
              value={playerOne}
              onChange={(e) => setPlayerOne(e.target.value)}
              className="bg-black/60 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 w-24 xs:w-32 truncate"
              placeholder="You"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
          <div className="absolute inset-x-2 bottom-14 z-50 rounded-2xl bg-slate-900/95 border-[2.5px] border-black p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] backdrop-blur-md max-h-[50vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Match Moves ({moves.length})
              </span>
              <button
                type="button"
                onClick={() => setShowMobileHistory(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 font-mono text-xs max-h-44">
              {movePairs.length === 0 ? (
                <div className="text-slate-500 text-xs italic py-4 text-center">
                  No moves played yet
                </div>
              ) : (
                movePairs.map((pair) => (
                  <div
                    key={pair.num}
                    className="flex items-center justify-between px-2 py-1 rounded bg-black/40 text-slate-300"
                  >
                    <span className="text-slate-500 w-7 font-bold">{pair.num}.</span>
                    <span className="text-amber-300 font-semibold flex-1">{pair.white}</span>
                    <span className="text-slate-200 font-semibold flex-1 text-right">{pair.black || "—"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mobile Result Overlay Banner */}
        {result && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-50 camp-card-canvas p-4 text-sm font-black text-center shadow-[6px_6px_0px_#000000] border-[2.5px] border-black animate-in zoom-in-95 duration-200">
            <div className="text-lg font-black mb-1">
              {result === "draw" ? "Game drawn." : result === "win" ? "You won! 🎉" : "You lost."}
            </div>
            {!session && (
              <p className="text-xs font-medium text-gray-600 mb-2">
                Sign in to save match results to your history.
              </p>
            )}
            {session && saveStatus === "saving" && (
              <p className="text-xs font-medium text-gray-600 mb-2">Saving match…</p>
            )}
            {session && saveStatus === "saved" && (
              <p className="text-xs font-medium text-emerald-700 mb-2">Saved to your match history.</p>
            )}
            {session && saveStatus === "error" && (
              <p className="text-xs font-medium text-red-600 mb-2">Couldn't save match — try again.</p>
            )}
            <button
              type="button"
              onClick={resetGame}
              className="camp-btn camp-btn-ember text-xs py-2 px-5 font-black shadow-[2px_2px_0px_#000000]"
            >
              Play Again
            </button>
          </div>
        )}
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
          <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/90 border-[2px] border-black shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-xs text-white font-black shadow-[1px_1px_0px_#000]">
                ♟
              </div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="opponent-fs" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Black:
                </label>
                <input
                  id="opponent-fs"
                  type="text"
                  value={playerTwo}
                  onChange={(e) => setPlayerTwo(e.target.value)}
                  className="bg-black/60 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 transition-colors w-28 sm:w-36"
                />
              </div>
            </div>
            {turn === "Black" && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-700 text-amber-300 px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] animate-pulse">
                To Move
              </span>
            )}
          </div>

          {/* Tactical Move History Log */}
          <div className="w-full rounded-xl bg-slate-900/80 border-[2px] border-black p-3 shadow-[3px_3px_0px_#000000] flex flex-col flex-1 min-h-[140px] max-h-[260px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <span>Match History</span>
              <span className="text-amber-400 font-mono text-[10px]">{moves.length} moves</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 font-mono text-xs">
              {movePairs.length === 0 ? (
                <div className="text-slate-500 text-xs italic py-6 text-center">
                  Moves will appear here as you play
                </div>
              ) : (
                movePairs.map((pair) => (
                  <div
                    key={pair.num}
                    className="flex items-center justify-between px-2.5 py-1 rounded bg-black/40 text-slate-300 hover:bg-black/60 transition-colors"
                  >
                    <span className="text-slate-500 w-8 font-bold">{pair.num}.</span>
                    <span className="text-amber-300 font-semibold flex-1">{pair.white}</span>
                    <span className="text-slate-200 font-semibold flex-1 text-right">{pair.black || "—"}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* White (You) Card */}
          <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/90 border-[2px] border-black shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-400 border border-black flex items-center justify-center text-xs text-black font-black shadow-[1px_1px_0px_#000]">
                ♙
              </div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="you-fs" className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">
                  White (You):
                </label>
                <input
                  id="you-fs"
                  type="text"
                  value={playerOne}
                  onChange={(e) => setPlayerOne(e.target.value)}
                  className="bg-black/60 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 transition-colors w-28 sm:w-36"
                />
              </div>
            </div>
            {turn === "White" && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] animate-pulse">
                Your Turn
              </span>
            )}
          </div>

          {/* Bottom Action: Reset Game */}
          <button
            type="button"
            onClick={handleNewGame}
            className={`camp-btn w-full text-xs py-2 px-3 font-black shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all ${
              confirmReset ? "camp-btn-red bg-rose-500 text-white animate-pulse" : "camp-btn-yellow"
            }`}
          >
            <span>↺</span>
            <span>{confirmReset ? "Confirm Reset Game?" : "New Game"}</span>
          </button>

          {/* Result card if finished */}
          {result && (
            <div className="camp-card-canvas w-full px-4 py-3 text-sm font-black text-center shadow-[4px_4px_0px_#000000] border-[2.5px] border-black">
              <div className="text-base font-black">
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
                className="mt-2 camp-btn camp-btn-ember text-xs py-1 px-4 font-black shadow-[2px_2px_0px_#000000]"
              >
                Play Again
              </button>
            </div>
          )}
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
            <span>{confirmReset ? "Reset?" : "New Game"}</span>
          </button>
        </div>
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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-xs text-white font-black shadow-[1px_1px_0px_#000] shrink-0">
            ♟
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <label htmlFor="opponent" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Black:
            </label>
            <input
              id="opponent"
              type="text"
              value={playerTwo}
              onChange={(e) => setPlayerTwo(e.target.value)}
              className="bg-black/60 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 transition-colors w-24 xs:w-32 sm:w-44"
            />
          </div>
        </div>
        {turn === "Black" && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-700 text-amber-300 px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] animate-pulse shrink-0">
            To Move
          </span>
        )}
      </div>

      {/* Board Tray */}
      {renderBoard({ maxWidth: "min(98vw, 520px)" })}

      {/* Player (White / You) Card */}
      <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border-[2px] border-black shadow-[3px_3px_0px_#000000]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-amber-400 border border-black flex items-center justify-center text-xs text-black font-black shadow-[1px_1px_0px_#000] shrink-0">
            ♙
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <label htmlFor="you" className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider shrink-0">
              White (You):
            </label>
            <input
              id="you"
              type="text"
              value={playerOne}
              onChange={(e) => setPlayerOne(e.target.value)}
              className="bg-black/60 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 transition-colors w-24 xs:w-32 sm:w-44"
            />
          </div>
        </div>
        {turn === "White" && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] animate-pulse shrink-0">
            Your Turn
          </span>
        )}
      </div>
    </div>
  );
}
