import React from "react";

interface GameResultCardProps {
  result: "win" | "loss" | "draw" | null;
  session: any;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onPlayAgain: () => void;
  ratingChange?: { before: number; after: number } | null;
  className?: string;
  isOverlay?: boolean;
}

export function GameResultCard({
  result,
  session,
  saveStatus,
  onPlayAgain,
  ratingChange = null,
  className = "",
  isOverlay = false,
}: GameResultCardProps) {
  if (!result) return null;

  const resultText =
    result === "draw"
      ? "Game drawn."
      : result === "win"
      ? "You won! 🎉"
      : "You lost.";

  if (isOverlay) {
    return (
      <div
        className={`absolute inset-x-4 top-1/2 -translate-y-1/2 z-50 camp-card-canvas p-4 text-sm font-black text-center animate-in zoom-in-95 duration-200 ${className}`}
      >
        <div className="text-lg font-black mb-1">{resultText}</div>
        {!session && (
          <p className="text-xs font-medium text-gray-600 mb-2">
            Sign in to save match results to your history.
          </p>
        )}
        {session && saveStatus === "saving" && (
          <p className="text-xs font-medium text-gray-600 mb-2">Saving match…</p>
        )}
        {session && saveStatus === "saved" && (
          <p className="text-xs font-medium text-emerald-700 mb-2">
            Saved.{ratingChange && (
              <> Rating: {ratingChange.before} →{" "}
                <span className={ratingChange.after >= ratingChange.before ? "text-emerald-700" : "text-red-600"}>
                  {ratingChange.after} ({ratingChange.after >= ratingChange.before ? "+" : ""}{ratingChange.after - ratingChange.before})
                </span>
              </>
            )}
          </p>
        )}
        {session && saveStatus === "error" && (
          <p className="text-xs font-medium text-red-600 mb-2">
            Couldn't save match — try again.
          </p>
        )}
        <button
          type="button"
          onClick={onPlayAgain}
          className="camp-btn camp-btn-ember text-xs py-2 px-5 font-black"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div
      className={`camp-card-canvas w-full px-4 py-3 text-sm font-black text-center ${className}`}
    >
      <div className="text-base sm:text-lg font-black">{resultText}</div>
      {!session && (
        <p className="text-xs font-medium text-gray-600 mt-1">
          Sign in to save match results to your history.
        </p>
      )}
      {session && saveStatus === "saving" && (
        <p className="text-xs font-medium text-gray-600 mt-1">Saving match…</p>
      )}
      {session && saveStatus === "saved" && (
        <p className="text-xs font-medium text-emerald-700 mt-1">
          Saved.{ratingChange && (
            <> Rating: {ratingChange.before} →{" "}
              <span className={ratingChange.after >= ratingChange.before ? "text-emerald-700" : "text-red-600"}>
                {ratingChange.after} ({ratingChange.after >= ratingChange.before ? "+" : ""}{ratingChange.after - ratingChange.before})
              </span>
            </>
          )}
        </p>
      )}
      {session && saveStatus === "error" && (
        <p className="text-xs font-medium text-red-600 mt-1">
          Couldn't save match — try again.
        </p>
      )}

      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-3 camp-btn camp-btn-ember text-xs py-1.5 px-4 font-black"
      >
        Play Again
      </button>
    </div>
  );
}
