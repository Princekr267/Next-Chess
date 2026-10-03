"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Copy,
  Check,
  Share2,
  Clock,
  Swords,
  LogOut,
  Flag,
  Handshake,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
  Sparkles,
} from "lucide-react";

import { customPieces } from "./pieces";
import {
  buildSquareStyles,
  darkSquareStyle,
  lightSquareStyle,
  dropSquareStyle,
} from "./board-styles";
import { PlayerCard } from "./PlayerCard";
import { ChessClock, useChessClocks } from "./ChessClock";
import { PromotionModal, PromotionPiece } from "./PromotionModal";
import { GameResultCard } from "./GameResultCard";
import { getPusherClient } from "@/lib/pusher-client";

interface OnlineChessGameProps {
  roomCode: string;
  initialRoom: any;
  myRole: "host" | "guest" | "spectator";
  myColor: "white" | "black";
  session: any;
  onExit: () => void;
}

export function OnlineChessGame({
  roomCode,
  initialRoom,
  myRole,
  myColor: initialMyColor,
  session,
  onExit,
}: OnlineChessGameProps) {
  const [room, setRoom] = useState(initialRoom);
  const [myColor, setMyColor] = useState<"white" | "black">(initialMyColor);
  const game = useMemo(() => new Chess(), []);

  // Board state
  const [fen, setFen] = useState(() => initialRoom?.currentFen || game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Connection & presence state
  const [isConnected, setIsConnected] = useState(false);
  const [opponentOnline, setOpponentOnline] = useState(true);
  const [disconnectTimer, setDisconnectTimer] = useState<number | null>(null);

  // Invite link copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals & interaction
  const [confirmResign, setConfirmResign] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [drawOfferSent, setDrawOfferSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Game over state
  const [gameOverResult, setGameOverResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [ratingChange, setRatingChange] = useState<{ before: number; after: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const finishedRef = useRef(false);

  // Pawn promotion
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    color: "w" | "b";
  } | null>(null);

  // Clocks
  const initialWhiteMs = room?.whiteTimeMs ?? null;
  const initialBlackMs = room?.blackTimeMs ?? null;
  const incrementMs = (room?.increment ?? 0) * 1000;

  const {
    whiteMs,
    blackMs,
    activeClock,
    isTimed,
    syncClocks,
    onMoveMade,
    stopClocks,
  } = useChessClocks(initialWhiteMs, initialBlackMs, incrementMs);

  // Load initial FEN into chess.js
  useEffect(() => {
    if (initialRoom?.currentFen) {
      try {
        game.load(initialRoom.currentFen);
        setFen(game.fen());
      } catch (err) {
        console.warn("Failed to load initial FEN", err);
      }
    }
  }, [initialRoom?.currentFen, game]);

  // Handle timeout on local player's turn
  const handleTimeout = useCallback(async () => {
    if (finishedRef.current || room.status !== "in_progress") return;
    finishedRef.current = true;
    stopClocks();

    const turn = game.turn() === "w" ? "white" : "black";
    const winner = turn === "white" ? "black" : "white";

    try {
      await axios.post(`/api/rooms/${roomCode}/finish`, {
        result: winner,
        reason: "timeout",
      });
    } catch (err) {
      console.error("Timeout reporting failed", err);
    }
  }, [game, room.status, roomCode, stopClocks]);

  // Finish game helper
  const finalizeGame = useCallback(
    async (result: "white" | "black" | "draw", reason: string) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      stopClocks();

      try {
        const { data } = await axios.post(`/api/rooms/${roomCode}/finish`, {
          result,
          reason,
        });

        const isWhite = myColor === "white";
        const myResult =
          result === "draw"
            ? "draw"
            : (result === "white" && isWhite) || (result === "black" && !isWhite)
            ? "win"
            : "loss";

        setGameOverResult(myResult);
        setGameOverReason(reason);

        const before = isWhite ? data.whiteRatingBefore : data.blackRatingBefore;
        const after = isWhite ? data.whiteRatingAfter : data.blackRatingAfter;
        if (before != null && after != null) {
          setRatingChange({ before, after });
        }
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to finish game", err);
      }
    },
    [myColor, roomCode, stopClocks],
  );

  // Pusher subscriptions
  useEffect(() => {
    let pusher: any = null;
    let channel: any = null;

    try {
      pusher = getPusherClient();
      const channelName = `presence-room-${roomCode.toUpperCase()}`;
      channel = pusher.subscribe(channelName);

      channel.bind("pusher:subscription_succeeded", (members: any) => {
        setIsConnected(true);
        // If 2 members in room, opponent is online
        setOpponentOnline(members.count >= 2);
      });

      channel.bind("pusher:member_added", () => {
        setOpponentOnline(true);
        setDisconnectTimer(null);
      });

      channel.bind("pusher:member_removed", () => {
        setOpponentOnline(false);
        setDisconnectTimer(60); // 60s countdown
      });

      // Guest joined event
      channel.bind("player-joined", (data: any) => {
        setRoom((prev: any) => ({
          ...prev,
          guestUserId: data.guestUserId,
          guestName: data.guestName,
          hostColor: data.hostColor,
          status: "in_progress",
        }));

        if (myRole === "host") {
          setMyColor(data.hostColor);
        } else {
          setMyColor(data.hostColor === "white" ? "black" : "white");
        }

        // Start white clock if timed
        if (isTimed) {
          syncClocks(
            initialWhiteMs ?? 300000,
            initialBlackMs ?? 300000,
            "white",
          );
        }
      });

      // Opponent move event
      channel.bind("move", (data: any) => {
        if (data.movedBy === session?.user?.id) return; // ignore our own broadcast

        try {
          const moveResult = game.move({
            from: data.from,
            to: data.to,
            promotion: data.promotion || undefined,
          });

          if (moveResult) {
            setFen(game.fen());
            setSelectedSquare(null);

            // Switch clock to our turn
            const byColor = moveResult.color === "w" ? "white" : "black";
            onMoveMade(byColor, data.whiteTimeMs, data.blackTimeMs);

            // Check game over on received move
            if (game.isGameOver()) {
              if (game.isCheckmate()) {
                const winner = game.turn() === "w" ? "black" : "white";
                finalizeGame(winner, "checkmate");
              } else if (game.isDraw()) {
                finalizeGame("draw", "stalemate_or_repetition");
              }
            }
          }
        } catch (err) {
          console.error("Error applying opponent move", err);
        }
      });

      // Draw offer event
      channel.bind("draw-offer", (data: any) => {
        if (data.fromUserId !== session?.user?.id) {
          setDrawOfferReceived(true);
        }
      });

      // Draw response event
      channel.bind("draw-response", (data: any) => {
        if (data.fromUserId !== session?.user?.id) {
          if (!data.accepted) {
            setDrawOfferSent(false);
            setStatusMessage("Opponent declined the draw offer.");
            setTimeout(() => setStatusMessage(null), 4000);
          }
        }
      });

      // Resignation event
      channel.bind("resign", (data: any) => {
        if (data.fromUserId !== session?.user?.id) {
          const winner = myColor;
          finalizeGame(winner, "opponent_resignation");
        }
      });

      // Game ended event
      channel.bind("game-ended", (data: any) => {
        finishedRef.current = true;
        stopClocks();

        const isWhite = myColor === "white";
        const myResult =
          data.result === "draw"
            ? "draw"
            : (data.result === "white" && isWhite) || (data.result === "black" && !isWhite)
            ? "win"
            : "loss";

        setGameOverResult(myResult);
        setGameOverReason(data.reason);

        const before = isWhite ? data.whiteRatingBefore : data.blackRatingBefore;
        const after = isWhite ? data.whiteRatingAfter : data.blackRatingAfter;
        if (before != null && after != null) {
          setRatingChange({ before, after });
        }
        setSaveStatus("saved");
      });
    } catch (err) {
      console.warn("Pusher client error", err);
    }

    return () => {
      if (channel) {
        channel.unbind_all();
        pusher?.unsubscribe(`presence-room-${roomCode.toUpperCase()}`);
      }
    };
  }, [
    roomCode,
    myRole,
    myColor,
    session?.user?.id,
    game,
    isTimed,
    initialWhiteMs,
    initialBlackMs,
    finalizeGame,
    onMoveMade,
    stopClocks,
    syncClocks,
  ]);

  // Periodic recovery fallback
  useEffect(() => {
    if (finishedRef.current) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/rooms/${roomCode}`);
        if (data.room) {
          if (data.room.status === "in_progress" && room.status === "waiting") {
            setRoom(data.room);
            setMyColor(data.myColor);
          }
          if (data.room.currentFen && data.room.currentFen !== game.fen()) {
            game.load(data.room.currentFen);
            setFen(game.fen());
          }
        }
      } catch {
        // fail silently on background poll
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [roomCode, room.status, game]);

  // Disconnect timer countdown
  useEffect(() => {
    if (disconnectTimer === null || disconnectTimer <= 0) return;

    const t = setInterval(() => {
      setDisconnectTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(t);
          if (room.status === "in_progress" && !finishedRef.current) {
            finalizeGame(myColor, "opponent_disconnected");
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [disconnectTimer, finalizeGame, myColor, room.status]);

  // Move submission
  async function submitMove(from: string, to: string, promotion?: string) {
    const nextFen = game.fen();
    const nextPgn = game.pgn();

    // Check game over locally
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === "w" ? "black" : "white";
        finalizeGame(winner, "checkmate");
      } else if (game.isDraw()) {
        finalizeGame("draw", "stalemate");
      }
    }

    try {
      await axios.post(`/api/rooms/${roomCode}/move`, {
        from,
        to,
        promotion,
        fen: nextFen,
        pgn: nextPgn,
        whiteTimeMs: whiteMs,
        blackTimeMs: blackMs,
      });
    } catch (err) {
      console.error("Failed to relay move to server", err);
    }
  }

  // Promotion handling
  function isPromotionMove(from: string, to: string): boolean {
    const piece = game.get(from as Square);
    if (!piece || piece.type !== "p") return false;
    if (piece.color === "w" && !to.endsWith("8")) return false;
    if (piece.color === "b" && !to.endsWith("1")) return false;

    const legalMoves = game.moves({ square: from as Square, verbose: true });
    return legalMoves.some((m) => m.to === to && !!m.promotion);
  }

  function handleSelectPromotionPiece(pieceChoice: PromotionPiece) {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;

    try {
      const move = game.move({ from, to, promotion: pieceChoice });
      if (move) {
        setFen(game.fen());
        setSelectedSquare(null);
        const byColor = move.color === "w" ? "white" : "black";
        onMoveMade(byColor);
        submitMove(from, to, pieceChoice);
      }
    } catch (err) {
      console.warn("Promotion move failed", err);
    } finally {
      setPendingPromotion(null);
    }
  }

  function onPieceDrop({
    sourceSquare,
    targetSquare,
  }: {
    piece: any;
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean {
    if (!targetSquare || finishedRef.current || room.status !== "in_progress") return false;

    // Check if it's player's turn
    const isMyTurn = (game.turn() === "w" && myColor === "white") || (game.turn() === "b" && myColor === "black");
    if (!isMyTurn) return false;

    // Promotion check
    if (isPromotionMove(sourceSquare, targetSquare)) {
      setPendingPromotion({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        color: game.turn(),
      });
      return false;
    }

    try {
      const move = game.move({ from: sourceSquare, to: targetSquare });
      if (!move) return false;

      setFen(game.fen());
      setSelectedSquare(null);
      const byColor = move.color === "w" ? "white" : "black";
      onMoveMade(byColor);
      submitMove(sourceSquare, targetSquare);
      return true;
    } catch {
      return false;
    }
  }

  function onSquareClick({ square }: { square: string }) {
    if (finishedRef.current || room.status !== "in_progress") return;

    const isMyTurn = (game.turn() === "w" && myColor === "white") || (game.turn() === "b" && myColor === "black");
    if (!isMyTurn) return;

    const clicked = square as Square;

    if (selectedSquare) {
      if (isPromotionMove(selectedSquare, clicked)) {
        setPendingPromotion({
          from: selectedSquare,
          to: clicked,
          color: game.turn(),
        });
        return;
      }

      try {
        const move = game.move({ from: selectedSquare, to: clicked });
        if (move) {
          setFen(game.fen());
          setSelectedSquare(null);
          const byColor = move.color === "w" ? "white" : "black";
          onMoveMade(byColor);
          submitMove(selectedSquare, clicked);
          return;
        }
      } catch {
        // illegal move
      }
    }

    // Select piece if it's player's piece
    const piece = game.get(clicked);
    if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
      setSelectedSquare(clicked);
    } else {
      setSelectedSquare(null);
    }
  }

  // Draw offer actions
  async function handleSendDrawOffer() {
    setDrawOfferSent(true);
    setStatusMessage("Draw offer sent. Waiting for response...");
    try {
      await axios.post(`/api/rooms/${roomCode}/event`, {
        type: "draw-offer",
      });
    } catch (err) {
      console.error("Failed to send draw offer", err);
      setDrawOfferSent(false);
    }
  }

  async function handleAcceptDraw() {
    setDrawOfferReceived(false);
    await finalizeGame("draw", "draw_agreement");
  }

  async function handleDeclineDraw() {
    setDrawOfferReceived(false);
    try {
      await axios.post(`/api/rooms/${roomCode}/event`, {
        type: "draw-response",
        payload: { accepted: false },
      });
    } catch (err) {
      console.error("Failed to decline draw", err);
    }
  }

  // Resignation action
  async function handleResign() {
    setConfirmResign(false);
    const winner = myColor === "white" ? "black" : "white";
    try {
      await axios.post(`/api/rooms/${roomCode}/event`, {
        type: "resign",
      });
    } catch {}
    await finalizeGame(winner, "resignation");
  }

  function handleCopy(text: string, isLink: boolean) {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  // Square highlighting
  const customSquareStyles = useMemo(() => {
    return buildSquareStyles(selectedSquare, game, pendingPromotion);
  }, [game, selectedSquare, pendingPromotion]);

  const opponentColor = myColor === "white" ? "black" : "white";
  const opponentName =
    myRole === "host"
      ? room.guestName || "Opponent (Waiting...)"
      : room.hostName || "Host";

  const isMyTurn =
    (game.turn() === "w" && myColor === "white") || (game.turn() === "b" && myColor === "black");

  // ── 1. WAITING ROOM VIEW ──────────────────────────────────────────────────
  if (room.status === "waiting") {
    const inviteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/play?mode=friend&room=${roomCode}`
        : "";

    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="camp-card-canvas max-w-lg w-full p-8 text-center"
        >
          {/* Top radar icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-purple-400 flex items-center justify-center mx-auto mb-4 text-black shadow-[3px_3px_8px_rgba(28,18,6,0.35)]">
            <Swords className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
            </span>
          </div>

          <span className="camp-badge camp-badge-violet mb-2">PRIVATE ROOM CREATED</span>

          <h2 className="text-2xl font-black text-gray-950 mb-1">Waiting for Friend</h2>
          <p className="text-xs sm:text-sm text-gray-700 font-medium mb-6">
            Share this room code or direct link with your friend. The duel will begin automatically the moment they join!
          </p>

          {/* Big Room Code Display */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {roomCode.split("").map((char, i) => (
              <div
                key={i}
                className="w-12 h-14 bg-amber-100 border-2 border-amber-950/40 rounded-xl flex items-center justify-center text-2xl font-mono font-black text-amber-950 shadow-[2px_2px_0px_#000]"
              >
                {char}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleCopy(roomCode, false)}
              className="camp-btn camp-btn-yellow py-2.5 px-3 text-xs font-black flex items-center justify-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? "Code Copied!" : "Copy Code"}
            </button>

            <button
              type="button"
              onClick={() => handleCopy(inviteUrl, true)}
              className="camp-btn camp-btn-white py-2.5 px-3 text-xs font-black flex items-center justify-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Share2 className="w-4 h-4" />}
              {copiedLink ? "Link Copied!" : "Copy Invite Link"}
            </button>
          </div>

          {/* Room Specs info pill */}
          <div className="bg-amber-950/10 rounded-xl p-3 text-xs font-bold text-amber-950/80 flex items-center justify-around mb-6">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {room.timeControl > 0 ? `${room.timeControl / 60}m + ${room.increment}s` : "Casual"}
            </span>
            <span>•</span>
            <span>Your Color: <strong className="capitalize">{myColor}</strong></span>
            <span>•</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Waiting...
            </span>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="camp-btn camp-btn-white w-full py-2.5 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Cancel and Leave Room
          </button>
        </motion.div>
      </div>
    );
  }

  // ── 2. ACTIVE CHESS ARENA VIEW ──────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 flex flex-col items-center">
      {/* Top Banner Alert (Opponent disconnected / Draw offer) */}
      <AnimatePresence>
        {disconnectTimer !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mb-3 p-3 bg-amber-500/90 text-amber-950 border border-amber-900 rounded-xl text-xs sm:text-sm font-black flex items-center justify-between shadow-[2px_2px_0px_#000]"
          >
            <span className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" /> Opponent disconnected. Auto-win in {disconnectTimer}s if they don't reconnect...
            </span>
          </motion.div>
        )}

        {drawOfferReceived && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mb-3 p-3.5 bg-purple-100 border-2 border-purple-800 rounded-xl flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000]"
          >
            <span className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-purple-700" /> Opponent offered a draw!
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptDraw}
                className="camp-btn camp-btn-ember py-1 px-3 text-xs font-black"
              >
                Accept Draw
              </button>
              <button
                type="button"
                onClick={handleDeclineDraw}
                className="camp-btn camp-btn-white py-1 px-3 text-xs font-bold text-gray-800"
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}

        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full mb-2 p-2 bg-amber-100 border border-amber-700 rounded-lg text-xs font-bold text-amber-950 text-center"
          >
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Arena Layout */}
      <div className="w-full flex flex-col items-center">
        {/* Opponent Card & Clock */}
        <div className="w-full max-w-[540px] flex items-center justify-between gap-3 mb-2">
          <div className="flex-1">
            <PlayerCard
              color={opponentColor}
              name={opponentName}
              onNameChange={() => {}}
              isTurn={!isMyTurn && room.status === "in_progress" && !gameOverResult}
              isCompact
            />
          </div>
          {isTimed && (
            <ChessClock
              timeMs={opponentColor === "white" ? whiteMs : blackMs}
              isActive={activeClock === opponentColor && room.status === "in_progress" && !gameOverResult}
              color={opponentColor}
              compact
            />
          )}
        </div>

        {/* Board Container */}
        <div
          className="relative rounded-2xl p-2.5 sm:p-3.5 bg-[#2a1b0e] border-4 border-[#4a311a] shadow-[0_12px_36px_rgba(0,0,0,0.65)]"
          style={{ width: "min(92vw, 540px)", height: "min(92vw, 540px)" }}
        >
          <Chessboard
            options={{
              id: "online-board",
              position: fen,
              boardOrientation: myColor,
              onPieceDrop,
              onSquareClick,
              squareStyles: customSquareStyles,
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
              animationDurationInMs: 180,
              showNotation: true,
            }}
          />

          {/* Promotion Modal */}
          {pendingPromotion && (
            <PromotionModal
              isOpen={true}
              color={pendingPromotion.color}
              fromSquare={pendingPromotion.from}
              toSquare={pendingPromotion.to}
              onSelectPiece={handleSelectPromotionPiece}
              onCancel={() => setPendingPromotion(null)}
            />
          )}

          {/* Game Result Overlay */}
          {gameOverResult && (
            <GameResultCard
              result={gameOverResult}
              reason={gameOverReason}
              session={session}
              saveStatus={saveStatus}
              ratingChange={ratingChange}
              onPlayAgain={onExit}
              isOverlay
            />
          )}
        </div>

        {/* Local Player Card & Clock */}
        <div className="w-full max-w-[540px] flex items-center justify-between gap-3 mt-2">
          <div className="flex-1">
            <PlayerCard
              color={myColor}
              name={session?.user?.name || "You"}
              onNameChange={() => {}}
              isTurn={isMyTurn && room.status === "in_progress" && !gameOverResult}
              isYou
              isCompact
            />
          </div>
          {isTimed && (
            <ChessClock
              timeMs={myColor === "white" ? whiteMs : blackMs}
              isActive={activeClock === myColor && room.status === "in_progress" && !gameOverResult}
              onTimeout={handleTimeout}
              color={myColor}
              compact
            />
          )}
        </div>

        {/* Bottom Duel Controls */}
        <div className="w-full max-w-[540px] flex items-center justify-between mt-4 pt-3 border-t border-amber-900/30">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/40">
              ROOM: {roomCode}
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-500"
              }`}
              title={isConnected ? "Real-time socket active" : "Connecting..."}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Draw Offer Button */}
            <button
              type="button"
              disabled={drawOfferSent || !!gameOverResult || room.status !== "in_progress"}
              onClick={handleSendDrawOffer}
              className="camp-btn camp-btn-white text-xs py-1.5 px-3 font-bold text-gray-800 disabled:opacity-40 flex items-center gap-1.5"
            >
              <Handshake className="w-3.5 h-3.5" />
              {drawOfferSent ? "Draw Offered" : "Offer Draw"}
            </button>

            {/* Resign Button */}
            {!confirmResign ? (
              <button
                type="button"
                disabled={!!gameOverResult || room.status !== "in_progress"}
                onClick={() => setConfirmResign(true)}
                className="camp-btn camp-btn-ember text-xs py-1.5 px-3 font-black disabled:opacity-40 flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" /> Resign
              </button>
            ) : (
              <div className="flex items-center gap-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={handleResign}
                  className="camp-btn bg-rose-600 text-white text-xs py-1.5 px-3 font-black"
                >
                  Confirm Resign?
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResign(false)}
                  className="camp-btn camp-btn-white text-xs py-1.5 px-2 font-bold text-gray-800"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onExit}
              className="camp-btn camp-btn-white text-xs py-1.5 px-2.5 font-bold text-gray-800"
              title="Exit Match"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
