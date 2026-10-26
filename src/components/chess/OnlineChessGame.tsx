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
  Maximize2,
  Minimize2,
  History,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
  Sparkles,
  X,
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
import { MoveHistory } from "./MoveHistory";
import { BoardWithCoordinates } from "./BoardWithCoordinates";
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
  const [moves, setMoves] = useState<string[]>(() => game.history());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  // Responsive & fullscreen states
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);

  // Connection & presence state
  const [isConnected, setIsConnected] = useState(false);
  const [opponentOnline, setOpponentOnline] = useState(true);
  const [disconnectTimer, setDisconnectTimer] = useState<number | null>(null);

  // Invite link copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Action confirmations
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
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

  useEffect(() => {
    if (room.status === "in_progress" && isTimed) {
      syncClocks(whiteMs, blackMs, game.turn() === "w" ? "white" : "black");
    }
  }, [room.status, isTimed, syncClocks, whiteMs, blackMs, game]);

  // Responsive window resize listener
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fullscreen listeners
  useEffect(() => {
    function onFullscreenChange() {
      const isNowFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isNowFullscreen);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Clean up fullscreen on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Load initial FEN or PGN into chess.js
  useEffect(() => {
    if (initialRoom?.pgn) {
      try {
        game.loadPgn(initialRoom.pgn);
        setFen(game.fen());
        setMoves(game.history());
        return;
      } catch {}
    }
    if (initialRoom?.currentFen) {
      try {
        game.load(initialRoom.currentFen);
        setFen(game.fen());
        setMoves(game.history());
      } catch (err) {
        console.warn("Failed to load initial FEN", err);
      }
    }
  }, [initialRoom?.currentFen, initialRoom?.pgn, game]);

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
      setGameOverResult(winner === myColor ? "win" : "loss");
      setGameOverReason("timeout");
      setSaveStatus("saved");
    } catch (err) {
      console.error("Timeout reporting failed", err);
      setGameOverResult(winner === myColor ? "win" : "loss");
      setGameOverReason("timeout");
      setSaveStatus("error");
    }
  }, [game, myColor, room.status, roomCode, stopClocks]);

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
    let channel: any = null;
    let connectionStateHandler: ((state: { current: string }) => void) | null = null;

    const pusher = getPusherClient();
    if (!pusher) {
      // Pusher not configured — rely on HTTP polling fallback
      return;
    }

    try {
      const channelName = `presence-room-${roomCode.toUpperCase()}`;
      channel = pusher.subscribe(channelName);

      channel.bind("pusher:subscription_succeeded", (members: any) => {
        setIsConnected(true);
        setOpponentOnline(members.count >= 2);
      });
      connectionStateHandler = (state: { current: string }) => {
        setIsConnected(state.current === "connected");
      };
      pusher.connection.bind("state_change", connectionStateHandler);

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
            setMoves(game.history());
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
          axios.get(`/api/rooms/${roomCode}`).then(({ data: state }) => {
            if (!state.room) return;
            if (state.room.pgn) game.loadPgn(state.room.pgn);
            else game.load(state.room.currentFen);
            setRoom(state.room);
            setFen(game.fen());
            setMoves(game.history());
            if (isTimed && state.room.whiteTimeMs != null && state.room.blackTimeMs != null) {
              syncClocks(state.room.whiteTimeMs, state.room.blackTimeMs,
                game.turn() === "w" ? "white" : "black");
            }
          }).catch((syncError) => console.error("Room state recovery failed", syncError));
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
      if (connectionStateHandler) {
        pusher?.connection.unbind("state_change", connectionStateHandler);
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

  // Polling fallback ref with constant dependencies
  const latestStateRef = useRef({
    room,
    game,
    myColor,
    isTimed,
    initialWhiteMs,
    initialBlackMs,
    syncClocks,
    finalizeGame,
    stopClocks,
  });

  useEffect(() => {
    latestStateRef.current = {
      room,
      game,
      myColor,
      isTimed,
      initialWhiteMs,
      initialBlackMs,
      syncClocks,
      finalizeGame,
      stopClocks,
    };
  });

  useEffect(() => {
    if (finishedRef.current) return;

    const pollIntervalMs = isConnected ? 5000 : 1200;
    const interval = setInterval(async () => {
      const state = latestStateRef.current;
      try {
        const { data } = await axios.get(`/api/rooms/${roomCode}`);
        if (!data.room) return;

        // Detect guest join (waiting → in_progress)
        if (data.room.status === "in_progress" && state.room.status === "waiting") {
          setRoom(data.room);
          setMyColor(data.myColor);

          // Start clocks if timed
          if (state.isTimed) {
            state.syncClocks(
              data.room.whiteTimeMs ?? state.initialWhiteMs ?? 300000,
              data.room.blackTimeMs ?? state.initialBlackMs ?? 300000,
              "white",
            );
          }
        }

        // Sync FEN & PGN (opponent's moves via polling)
        if (data.room.currentFen && data.room.currentFen !== state.game.fen()) {
          if (data.room.pgn) {
            try {
              state.game.loadPgn(data.room.pgn);
            } catch {
              state.game.load(data.room.currentFen);
            }
          } else {
            state.game.load(data.room.currentFen);
          }
          setFen(state.game.fen());
          setMoves(state.game.history());

          // Sync clocks from server
          if (state.isTimed && data.room.whiteTimeMs != null && data.room.blackTimeMs != null) {
            const turn = state.game.turn() === "w" ? "white" : "black";
            state.syncClocks(data.room.whiteTimeMs, data.room.blackTimeMs, turn);
          }

          // Check game over
          if (state.game.isGameOver() && !finishedRef.current) {
            if (state.game.isCheckmate()) {
              const winner = state.game.turn() === "w" ? "black" : "white";
              state.finalizeGame(winner, "checkmate");
            } else if (state.game.isDraw()) {
              state.finalizeGame("draw", "stalemate_or_repetition");
            }
          }
        }

        // Detect game completed by opponent (resignation, timeout, etc.)
        if (data.room.status === "completed" && !finishedRef.current) {
          finishedRef.current = true;
          state.stopClocks();
          const isWhite = state.myColor === "white";
          const result = data.room.result;
          const myResult =
            result === "draw"
              ? "draw"
              : (result === "white" && isWhite) || (result === "black" && !isWhite)
              ? "win"
              : "loss";
          setGameOverResult(myResult);
          setGameOverReason(data.room.resultReason ?? "unknown");
          setSaveStatus("saved");
        }
      } catch {
        // fail silently on background poll
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [roomCode, isConnected]);

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

  // Move submission to server
  async function submitMove(from: string, to: string, promotion?: string) {
    try {
      const { data } = await axios.post(`/api/rooms/${roomCode}/move`, { from, to, promotion });
      if (isTimed) {
        const movedColor = game.turn() === "w" ? "black" : "white";
        onMoveMade(movedColor, data.whiteTimeMs, data.blackTimeMs);
      }

      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          const winner = game.turn() === "w" ? "black" : "white";
          await finalizeGame(winner, "checkmate");
        } else if (game.isDraw()) {
          await finalizeGame("draw", "stalemate");
        }
      }
    } catch (err: any) {
      console.error("Move failed to post", err);
      setStatusMessage("Move not accepted. Restoring the latest room position…");
      try {
        const { data } = await axios.get(`/api/rooms/${roomCode}`);
        const serverRoom = data.room;
        if (serverRoom?.pgn) game.loadPgn(serverRoom.pgn);
        else if (serverRoom?.currentFen) game.load(serverRoom.currentFen);
        if (serverRoom) {
          setRoom(serverRoom);
          setFen(game.fen());
          setMoves(game.history());
          if (isTimed && serverRoom.whiteTimeMs != null && serverRoom.blackTimeMs != null) {
            syncClocks(serverRoom.whiteTimeMs, serverRoom.blackTimeMs,
              game.turn() === "w" ? "white" : "black");
          }
          if (serverRoom.status === "completed") {
            finishedRef.current = true;
            stopClocks();
            setGameOverReason(serverRoom.resultReason ?? "unknown");
            setGameOverResult(serverRoom.result === "draw" ? "draw" :
              serverRoom.result === myColor ? "win" : "loss");
          }
        }
      } catch (syncError) {
        console.error("Room state recovery failed", syncError);
      }
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  // Promotion detection helper
  function isPromotionMove(from: string, to: string): boolean {
    const piece = game.get(from as Square);
    if (!piece || piece.type !== "p") return false;
    const isPawnPromotion =
      (piece.color === "w" && to[1] === "8") ||
      (piece.color === "b" && to[1] === "1");
    return isPawnPromotion;
  }

  function handleSelectPromotionPiece(pieceChoice: PromotionPiece) {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;

    try {
      const move = game.move({ from, to, promotion: pieceChoice });
      if (move) {
        setFen(game.fen());
        setMoves(game.history());
        setSelectedSquare(null);
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
      setMoves(game.history());
      setSelectedSquare(null);
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
          setMoves(game.history());
          setSelectedSquare(null);
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
    if (!confirmResign) {
      setConfirmResign(true);
      setTimeout(() => setConfirmResign(false), 5000);
      return;
    }
    setConfirmResign(false);
    const winner = myColor === "white" ? "black" : "white";
    try {
      await axios.post(`/api/rooms/${roomCode}/event`, {
        type: "resign",
      });
    } catch {}
    await finalizeGame(winner, "resignation");
  }

  // Exit match action
  function handleExitGame() {
    if (!confirmExit) {
      setConfirmExit(true);
      setTimeout(() => setConfirmExit(false), 4000);
      return;
    }
    setConfirmExit(false);
    onExit();
  }

  async function toggleFullscreen() {
    try {
      if (!isFullscreen) {
        const el = gameWrapperRef.current || document.documentElement;
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
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle fallback:", err);
      setIsFullscreen((prev) => !prev);
    }
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

  // Highlight squares
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
  const isOpponentTurn = !isMyTurn && room.status === "in_progress" && !gameOverResult;
  const isCheck = game.inCheck() && !gameOverResult;
  const currentTurnLabel = game.turn() === "w" ? "White" : "Black";

  // Shared board renderer with external border coordinates
  const renderBoard = (style?: React.CSSProperties) => (
    <div
      ref={containerRef}
      className="w-full shrink-0 touch-none select-none"
      style={{ margin: "0 auto", ...style }}
    >
      <BoardWithCoordinates orientation={myColor}>
        <Chessboard
          options={{
            id: `online-board-${roomCode}`,
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
            showNotation: false, // clean squares: coordinates rendered on outside wooden border!
          }}
        />
      </BoardWithCoordinates>
    </div>
  );

  // Promotion Selection Modal
  const renderPromotionModal = () => (
    <PromotionModal
      isOpen={!!pendingPromotion}
      color={pendingPromotion?.color || "w"}
      fromSquare={pendingPromotion?.from || ""}
      toSquare={pendingPromotion?.to || ""}
      onSelectPiece={handleSelectPromotionPiece}
      onCancel={() => setPendingPromotion(null)}
    />
  );

  // Draw Offer Banner
  const renderDrawOfferBanner = () => (
    <AnimatePresence>
      {drawOfferReceived && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full p-3.5 bg-purple-100 border-2 border-purple-800 rounded-xl flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000]"
        >
          <span className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-2">
            <Handshake className="w-5 h-5 text-purple-700" /> Opponent offered a draw!
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptDraw}
              className="camp-btn camp-btn-yellow py-1 px-3 text-xs font-black shadow-[1px_1px_0px_#000]"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleDeclineDraw}
              className="camp-btn camp-btn-slate py-1 px-3 text-xs font-bold shadow-[1px_1px_0px_#000]"
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Status & Disconnect Alerts
  const renderAlerts = () => (
    <AnimatePresence>
      {disconnectTimer !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full p-3 bg-amber-500/95 text-amber-950 border border-amber-900 rounded-xl text-xs sm:text-sm font-black flex items-center justify-between shadow-[2px_2px_0px_#000]"
        >
          <span className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" /> Opponent disconnected. Auto-win in {disconnectTimer}s...
          </span>
        </motion.div>
      )}

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="w-full p-2 bg-amber-100 border border-amber-700 rounded-lg text-xs font-bold text-amber-950 text-center"
        >
          {statusMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // 1. WAITING ROOM VIEW
  // ══════════════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MOBILE FULLSCREEN VIEW
  // ══════════════════════════════════════════════════════════════════════════
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
        {/* Top: Opponent Info & Fullscreen toggle */}
        <div className="w-full flex items-center justify-between gap-2 px-1 py-1">
          <div className="min-w-0 flex-1">
            <PlayerCard
              color={opponentColor}
              name={opponentName}
              isTurn={isOpponentTurn}
              isCompact
              inputId="opponent-mobile-fs"
              accessorySlot={
                isTimed ? (
                  <ChessClock
                    timeMs={opponentColor === "white" ? whiteMs : blackMs}
                    isActive={activeClock === opponentColor && room.status === "in_progress" && !gameOverResult}
                    color={opponentColor}
                    compact
                  />
                ) : undefined
              }
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="camp-badge camp-badge-violet text-[10px] px-2 py-0.5">
              ⚔️ Duel
            </span>
            <span
              className={`camp-badge text-[11px] px-2.5 py-1 ${
                currentTurnLabel === "White" ? "camp-badge-yellow" : "camp-badge-slate"
              }`}
            >
              ♟ {currentTurnLabel}
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
                color={myColor}
                name={session?.user?.name || "You"}
                isTurn={isMyTurn && room.status === "in_progress" && !gameOverResult}
                isCompact
                isYou
                inputId="you-mobile-fs"
                accessorySlot={
                  isTimed ? (
                    <ChessClock
                      timeMs={myColor === "white" ? whiteMs : blackMs}
                      isActive={activeClock === myColor && room.status === "in_progress" && !gameOverResult}
                      onTimeout={handleTimeout}
                      color={myColor}
                      compact
                    />
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* Action Row on Mobile Fullscreen */}
          <div className="flex items-center gap-1.5 justify-between">
            <button
              type="button"
              disabled={drawOfferSent || !!gameOverResult || room.status !== "in_progress"}
              onClick={handleSendDrawOffer}
              className="camp-btn camp-btn-slate text-xs py-1.5 px-2.5 font-black flex items-center gap-1 disabled:opacity-40"
              title="Offer mutual draw"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>{drawOfferSent ? "Offered" : "Draw"}</span>
            </button>

            <button
              type="button"
              disabled={!!gameOverResult || room.status !== "in_progress"}
              onClick={handleResign}
              className={`camp-btn text-xs py-1.5 px-2.5 font-black flex items-center gap-1 disabled:opacity-40 ${
                confirmResign ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-slate"
              }`}
              title="Resign game"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{confirmResign ? "Confirm?" : "Resign"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMobileHistory((prev) => !prev)}
              className="camp-btn camp-btn-slate text-xs py-1.5 px-2.5 font-black flex items-center gap-1"
              title="View moves"
            >
              <History className="w-3.5 h-3.5" />
              <span>{moves.length}</span>
            </button>

            <button
              type="button"
              onClick={handleExitGame}
              className={`camp-btn text-xs py-1.5 px-2.5 font-black flex items-center gap-1 ${
                confirmExit ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-slate"
              }`}
              title="Exit match"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{confirmExit ? "Confirm?" : "Exit"}</span>
            </button>
          </div>
        </div>

        {renderDrawOfferBanner()}
        {renderAlerts()}
        {renderPromotionModal()}

        {showMobileHistory && (
          <MoveHistory
            moves={moves}
            isMobileDrawer
            onCloseDrawer={() => setShowMobileHistory(false)}
          />
        )}

        {gameOverResult && (
          <GameResultCard
            result={gameOverResult}
            reason={gameOverReason}
            session={session}
            saveStatus={saveStatus}
            onPlayAgain={onExit}
            onExit={onExit}
            ratingChange={ratingChange}
            isOverlay
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. DESKTOP FULLSCREEN ARENA
  // ══════════════════════════════════════════════════════════════════════════
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
            color={opponentColor}
            name={opponentName}
            isTurn={isOpponentTurn}
            inputId="opponent-fs"
            className="max-w-[min(90vh,calc(100vw-420px),820px)]"
            accessorySlot={
              isTimed ? (
                <ChessClock
                  timeMs={opponentColor === "white" ? whiteMs : blackMs}
                  isActive={activeClock === opponentColor && room.status === "in_progress" && !gameOverResult}
                  color={opponentColor}
                />
              ) : undefined
            }
          />

          {renderBoard({ width: "min(84vh, calc(100vw - 420px), 820px)", maxWidth: "100%" })}

          <PlayerCard
            color={myColor}
            name={session?.user?.name || "You"}
            isTurn={isMyTurn && room.status === "in_progress" && !gameOverResult}
            isYou
            inputId="you-fs"
            className="max-w-[min(90vh,calc(100vw-420px),820px)]"
            accessorySlot={
              isTimed ? (
                <ChessClock
                  timeMs={myColor === "white" ? whiteMs : blackMs}
                  isActive={activeClock === myColor && room.status === "in_progress" && !gameOverResult}
                  onTimeout={handleTimeout}
                  color={myColor}
                />
              ) : undefined
            }
          />
        </div>

        {/* Right: Side Dashboard */}
        <div className="w-84 lg:w-96 flex flex-col gap-4 shrink-0 max-h-[92vh] justify-between">
          <div
            className="rounded-2xl p-4 bg-[#261a0e]/95 border border-[#48331d]/60 flex flex-col gap-3"
            style={{
              boxShadow: "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-200/60">
                  Fullscreen Arena
                </span>
                <span className="camp-badge camp-badge-violet text-[10px] px-2 py-0.5">
                  ⚔️ Friend Duel
                </span>
              </div>
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Exit Fullscreen (Esc)"
                className="camp-btn camp-btn-white text-xs py-1 px-3 font-black flex items-center gap-1.5 text-stone-950 hover:scale-105 active:scale-95 transition-all"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </button>
            </div>

            {/* Turn Banner */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181008] border border-amber-950">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black ${
                    currentTurnLabel === "White"
                      ? "bg-amber-300 text-amber-950"
                      : "bg-[#100a05] text-amber-100 border border-amber-900/50"
                  }`}
                >
                  {currentTurnLabel === "White" ? "♙" : "♟"}
                </div>
                <div>
                  <div className="text-sm font-black text-amber-100">
                    {currentTurnLabel}&apos;s Turn
                  </div>
                  <div className="text-[11px] font-medium text-amber-300/70">
                    {isMyTurn ? "Your turn to move" : `${opponentName}'s turn`}
                  </div>
                </div>
              </div>

              {isCheck && (
                <span className="camp-badge camp-badge-red text-xs px-2.5 py-1 animate-bounce">
                  ⚠️ Check!
                </span>
              )}
            </div>

            {renderDrawOfferBanner()}
            {renderAlerts()}
          </div>

          {/* Move History */}
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
                disabled={drawOfferSent || !!gameOverResult || room.status !== "in_progress"}
                onClick={handleSendDrawOffer}
                className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>{drawOfferSent ? "Draw Offered" : "Offer Draw"}</span>
              </button>

              <button
                type="button"
                disabled={!!gameOverResult || room.status !== "in_progress"}
                onClick={handleResign}
                className={`camp-btn text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                  confirmResign ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-slate"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{confirmResign ? "Confirm Resign?" : "Resign"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExitGame}
              className={`camp-btn w-full text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 transition-all ${
                confirmExit ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-yellow"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{confirmExit ? "Confirm Exit Room?" : "Exit Match"}</span>
            </button>
          </div>

          {gameOverResult && (
            <GameResultCard
              result={gameOverResult}
              reason={gameOverReason}
              session={session}
              saveStatus={saveStatus}
              onPlayAgain={onExit}
              onExit={onExit}
              ratingChange={ratingChange}
            />
          )}
        </div>

        {renderPromotionModal()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. RESPONSIVE PLAY ARENA (Desktop 2-Column + Mobile Single-Column)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={gameWrapperRef}
      className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8 transition-all"
    >
      {/* LEFT COLUMN: Chess Board Arena */}
      <div className="flex flex-col items-center gap-2.5 w-full max-w-[min(98vw,560px)] shrink-0">
        {/* Opponent Card with integrated Clock */}
        <PlayerCard
          color={opponentColor}
          name={opponentName}
          isTurn={isOpponentTurn}
          inputId="opponent"
          accessorySlot={
            isTimed ? (
              <ChessClock
                timeMs={opponentColor === "white" ? whiteMs : blackMs}
                isActive={activeClock === opponentColor && room.status === "in_progress" && !gameOverResult}
                color={opponentColor}
                compact
              />
            ) : undefined
          }
        />

        {/* Board Tray with outer wood coordinates */}
        {renderBoard({ maxWidth: "min(98vw, 560px)" })}

        {/* Player (You) Card with integrated Clock */}
        <PlayerCard
          color={myColor}
          name={session?.user?.name || "You"}
          isTurn={isMyTurn && room.status === "in_progress" && !gameOverResult}
          isYou
          inputId="you"
          accessorySlot={
            isTimed ? (
              <ChessClock
                timeMs={myColor === "white" ? whiteMs : blackMs}
                isActive={activeClock === myColor && room.status === "in_progress" && !gameOverResult}
                onTimeout={handleTimeout}
                color={myColor}
                compact
              />
            ) : undefined
          }
        />

        {/* Mobile-Only Controls Bar (hidden on desktop lg) */}
        <div className="w-full lg:hidden flex flex-col gap-2.5 pt-1">
          {/* Turn status + Check + Moves drawer trigger */}
          <div className="w-full flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`camp-badge text-xs px-3 py-1 ${
                  currentTurnLabel === "White" ? "camp-badge-yellow" : "camp-badge-slate"
                }`}
              >
                ♟ {currentTurnLabel} to move
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

          {/* Alerts on mobile */}
          {renderDrawOfferBanner()}
          {renderAlerts()}

          {/* Mobile Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={drawOfferSent || !!gameOverResult || room.status !== "in_progress"}
              onClick={handleSendDrawOffer}
              className="camp-btn camp-btn-slate text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
              title="Offer mutual draw"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>{drawOfferSent ? "Offered" : "Draw"}</span>
            </button>

            <button
              type="button"
              disabled={!!gameOverResult || room.status !== "in_progress"}
              onClick={handleResign}
              className={`camp-btn text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                confirmResign ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-slate"
              }`}
              title="Resign game"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{confirmResign ? "Confirm?" : "Resign"}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="camp-btn camp-btn-white text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 text-stone-900"
              title="Fullscreen Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={handleExitGame}
              className={`camp-btn text-xs py-2 px-3 font-black flex items-center justify-center gap-1.5 transition-all ${
                confirmExit ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-slate"
              }`}
              title="Exit game"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{confirmExit ? "Confirm?" : "Exit"}</span>
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
            <div className="flex items-center gap-2">
              <span className="camp-badge camp-badge-violet text-[10px] px-2 py-0.5">
                ⚔️ Friend Duel
              </span>
              <div
                className="flex items-center gap-1 text-[11px] font-mono font-black text-amber-300/90 bg-[#160d05] border border-amber-900/40 px-2 py-0.5 rounded-lg cursor-pointer hover:border-amber-400 transition-colors"
                onClick={() => handleCopy(roomCode, false)}
                title="Click to copy room code"
              >
                <span>{roomCode}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 opacity-60" />
                )}
                <span
                  className={`w-2 h-2 rounded-full ml-0.5 ${
                    isConnected ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-rose-500"
                  }`}
                  title={isConnected ? "Real-time socket active" : "Reconnecting..."}
                />
              </div>
            </div>
          </div>

          {/* Active Turn Banner */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181008] border border-amber-950">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black ${
                  currentTurnLabel === "White"
                    ? "bg-amber-300 text-amber-950"
                    : "bg-[#100a05] text-amber-100 border border-amber-900/50"
                }`}
                style={{
                  boxShadow:
                    currentTurnLabel === "White"
                      ? "2px 2px 6px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(180,120,30,0.3), inset 2px 2px 4px rgba(255,255,255,0.7)"
                      : "2px 2px 6px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,210,130,0.15)",
                }}
              >
                {currentTurnLabel === "White" ? "♙" : "♟"}
              </div>
              <div>
                <div className="text-sm font-black text-amber-100">
                  {currentTurnLabel}&apos;s Turn
                </div>
                <div className="text-[11px] font-medium text-amber-300/70">
                  {isMyTurn ? "Your turn to move" : `${opponentName}'s turn`}
                </div>
              </div>
            </div>

            {isCheck && (
              <span className="camp-badge camp-badge-red text-xs px-2.5 py-1 animate-bounce">
                ⚠️ Check!
              </span>
            )}
          </div>

          {renderDrawOfferBanner()}
          {renderAlerts()}
        </div>

        {/* 2. Move Notation Log */}
        <MoveHistory moves={moves} className="flex-1 min-h-[220px]" />

        {/* 3. Action Buttons Panel */}
        <div
          className="rounded-2xl p-3.5 bg-[#261a0e]/95 border border-[#48331d]/60 flex flex-col gap-2.5"
          style={{
            boxShadow:
              "4px 4px 14px rgba(24,14,5,0.4), inset -3px -3px 8px rgba(24,14,5,0.3), inset 3px 3px 8px rgba(255,215,130,0.06)",
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={drawOfferSent || !!gameOverResult || room.status !== "in_progress"}
              onClick={handleSendDrawOffer}
              className="camp-btn camp-btn-slate text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
              title="Offer mutual draw"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>{drawOfferSent ? "Draw Offered" : "Offer Draw"}</span>
            </button>

            <button
              type="button"
              disabled={!!gameOverResult || room.status !== "in_progress"}
              onClick={handleResign}
              className={`camp-btn text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                confirmResign ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-slate"
              }`}
              title="Resign game"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{confirmResign ? "Confirm Resign?" : "Resign"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="camp-btn camp-btn-white text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 text-stone-900"
              title="Fullscreen Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={handleExitGame}
              className={`camp-btn text-xs py-2.5 px-3 font-black flex items-center justify-center gap-1.5 transition-all ${
                confirmExit ? "camp-btn-red bg-rose-600 text-white animate-pulse" : "camp-btn-slate"
              }`}
              title="Exit room to modes"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{confirmExit ? "Confirm Exit?" : "Exit Match"}</span>
            </button>
          </div>
        </div>

        {/* Game Result Overlay / Card */}
        {gameOverResult && (
          <GameResultCard
            result={gameOverResult}
            reason={gameOverReason}
            session={session}
            saveStatus={saveStatus}
            onPlayAgain={onExit}
            onExit={onExit}
            ratingChange={ratingChange}
          />
        )}
      </div>

      {renderPromotionModal()}
    </div>
  );
}
