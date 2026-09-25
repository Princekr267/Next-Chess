import { describe, it, expect } from "vitest";
import {
  expectedScore,
  calculateNewRating,
  resultToScore,
  DEFAULT_K,
} from "./elo";

// `describe` groups related tests together under a label.
describe("expectedScore", () => {
  it("returns 0.5 when both players have equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
  });

  it("gives the higher-rated player a probability above 0.5", () => {
    const result = expectedScore(1400, 1200);
    expect(result).toBeGreaterThan(0.5);
  });

  it("gives the lower-rated player a probability below 0.5", () => {
    const result = expectedScore(1200, 1400);
    expect(result).toBeLessThan(0.5);
  });
});

describe("resultToScore", () => {
  it("maps win to 1", () => {
    expect(resultToScore("win")).toBe(1);
  });

  it("maps draw to 0.5", () => {
    expect(resultToScore("draw")).toBe(0.5);
  });

  it("maps loss to 0", () => {
    expect(resultToScore("loss")).toBe(0);
  });
});

describe("calculateNewRating", () => {
  it("increases rating after a win against an equal opponent", () => {
    const newRating = calculateNewRating(1200, 1200, 1);
    // Expected score was 0.5, actual was 1 -> rating should rise by K * 0.5
    expect(newRating).toBe(1200 + DEFAULT_K * 0.5);
  });

  it("decreases rating after a loss against an equal opponent", () => {
    const newRating = calculateNewRating(1200, 1200, 0);
    expect(newRating).toBe(1200 - DEFAULT_K * 0.5);
  });

  it("leaves rating unchanged after a draw between equal opponents", () => {
    const newRating = calculateNewRating(1200, 1200, 0.5);
    expect(newRating).toBe(1200);
  });

  it("always returns a whole number (ratings are rounded)", () => {
    const newRating = calculateNewRating(1250, 1180, 1);
    expect(Number.isInteger(newRating)).toBe(true);
  });

  it("rewards beating a much stronger opponent more than beating an equal one", () => {
    const gainVsEqual = calculateNewRating(1200, 1200, 1) - 1200;
    const gainVsStronger = calculateNewRating(1200, 1600, 1) - 1200;
    expect(gainVsStronger).toBeGreaterThan(gainVsEqual);
  });
});