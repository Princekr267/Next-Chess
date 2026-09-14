/**
 * Elo rating calculation.
 *
 * See: https://en.wikipedia.org/wiki/Elo_rating_system
 *
 * This is a pure function on purpose — no database, no React, no side effects.
 * That makes it trivial to unit test and easy to reason about in isolation.
 */

export type MatchScore = 1 | 0.5 | 0; // win | draw | loss

/** Default K-factor: how fast ratings move. Higher = more volatile. */
export const DEFAULT_K = 32;

/** The fixed rating used to stand in for an untracked local opponent. */
export const PHANTOM_OPPONENT_RATING = 1200;

/**
 * The probability that the player rated `playerRating` beats an opponent
 * rated `opponentRating`, according to the Elo model.
 * Returns a number between 0 and 1. Equal ratings -> exactly 0.5.
 */
export function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Computes the player's new rating after one game.
 *
 * @param playerRating  the player's rating before this game
 * @param opponentRating the opponent's rating (or a fixed stand-in rating)
 * @param score        1 for a win, 0.5 for a draw, 0 for a loss (from the player's perspective)
 * @param k            the K-factor; defaults to DEFAULT_K
 */
export function calculateNewRating(
  playerRating: number,
  opponentRating: number,
  score: MatchScore,
  k: number = DEFAULT_K
): number {
  const expected = expectedScore(playerRating, opponentRating);
  const newRating = playerRating + k * (score - expected);
  // Ratings are conventionally whole numbers.
  return Math.round(newRating);
}

/** Converts your app's "win" | "loss" | "draw" result into an Elo score. */
export function resultToScore(result: "win" | "loss" | "draw"): MatchScore {
  if (result === "win") return 1;
  if (result === "draw") return 0.5;
  return 0;
}