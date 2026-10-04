"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ChessClockProps {
  /** Remaining time in milliseconds */
  timeMs: number;
  /** Whether this clock is currently ticking */
  isActive: boolean;
  /** Callback when time runs out */
  onTimeout?: () => void;
  /** Color label */
  color: "white" | "black";
  /** Compact mode */
  compact?: boolean;
}

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ChessClock({
  timeMs,
  isActive,
  onTimeout,
  color,
  compact = false,
}: ChessClockProps) {
  const [displayMs, setDisplayMs] = useState(timeMs);
  const lastTickRef = useRef<number>(Date.now());
  const timedOutRef = useRef(false);

  // Sync display with external timeMs prop
  useEffect(() => {
    setDisplayMs(timeMs);
    timedOutRef.current = false;
  }, [timeMs]);

  // Tick the clock when active
  useEffect(() => {
    if (!isActive || displayMs <= 0) return;

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      setDisplayMs((prev) => {
        const next = Math.max(0, prev - elapsed);
        if (next <= 0 && !timedOutRef.current) {
          timedOutRef.current = true;
          onTimeout?.();
        }
        return next;
      });
    }, 100); // tick every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [isActive, displayMs <= 0, onTimeout]);

  const isLow = displayMs < 30_000; // under 30 seconds
  const isCritical = displayMs < 10_000; // under 10 seconds

  const isWhite = color === "white";

  return (
    <div
      className={`flex items-center gap-2 rounded-xl font-mono font-black transition-all ${
        compact ? "px-2.5 py-1 text-sm" : "px-3.5 py-1.5 text-base sm:text-lg"
      } ${
        isActive
          ? isCritical
            ? "bg-rose-600 text-white animate-pulse"
            : isLow
              ? "bg-amber-500 text-amber-950"
              : isWhite
                ? "bg-amber-300 text-amber-950"
                : "bg-slate-700 text-amber-100"
          : isWhite
            ? "bg-amber-300/40 text-amber-200/70"
            : "bg-slate-800/60 text-slate-400"
      }`}
      style={{
        boxShadow: isActive
          ? "2px 3px 8px rgba(0,0,0,0.35), inset -1px -1px 3px rgba(0,0,0,0.2), inset 1px 1px 3px rgba(255,255,255,0.3)"
          : "1px 2px 4px rgba(0,0,0,0.2)",
      }}
    >
      <span className="text-xs opacity-60">⏱</span>
      <span>{formatTime(displayMs)}</span>
    </div>
  );
}

/**
 * Hook that manages a pair of chess clocks for online play.
 */
export function useChessClocks(
  initialWhiteMs: number | null,
  initialBlackMs: number | null,
  incrementMs: number,
) {
  const [whiteMs, setWhiteMs] = useState(initialWhiteMs ?? 0);
  const [blackMs, setBlackMs] = useState(initialBlackMs ?? 0);
  const [activeClock, setActiveClock] = useState<"white" | "black" | null>(null);
  const isTimed = initialWhiteMs !== null && initialWhiteMs > 0;

  const syncClocks = useCallback(
    (wMs: number, bMs: number, active: "white" | "black" | null) => {
      setWhiteMs(wMs);
      setBlackMs(bMs);
      setActiveClock(active);
    },
    [],
  );

  /** Call after a move — switches the active clock and applies increment. */
  const onMoveMade = useCallback(
    (byColor: "white" | "black", newWhiteMs?: number, newBlackMs?: number) => {
      if (!isTimed) return;
      if (newWhiteMs !== undefined) setWhiteMs(newWhiteMs);
      if (newBlackMs !== undefined) setBlackMs(newBlackMs);

      // Add increment to the player who just moved
      if (byColor === "white") {
        setWhiteMs((prev) => (newWhiteMs ?? prev) + incrementMs);
        setActiveClock("black");
      } else {
        setBlackMs((prev) => (newBlackMs ?? prev) + incrementMs);
        setActiveClock("white");
      }
    },
    [incrementMs, isTimed],
  );

  const stopClocks = useCallback(() => {
    setActiveClock(null);
  }, []);

  return { whiteMs, blackMs, activeClock, isTimed, syncClocks, onMoveMade, stopClocks };
}
