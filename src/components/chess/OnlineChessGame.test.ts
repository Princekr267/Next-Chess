import { describe, it, expect } from "vitest";
import { fenPly } from "./OnlineChessGame";

describe("fenPly", () => {
  it("returns 0 for initial standard chess board", () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    expect(fenPly(startFen)).toBe(0);
  });

  it("returns 1 after 1. e4 (Black to move, fullmove 1)", () => {
    const fenAfterE4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    expect(fenPly(fenAfterE4)).toBe(1);
  });

  it("returns 2 after 1... e5 (White to move, fullmove 2)", () => {
    const fenAfterE5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
    expect(fenPly(fenAfterE5)).toBe(2);
  });

  it("returns 3 after 2. Nf3 (Black to move, fullmove 2)", () => {
    const fenAfterNf3 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
    expect(fenPly(fenAfterNf3)).toBe(3);
  });

  it("returns 4 after 2... Nc6 (White to move, fullmove 3)", () => {
    const fenAfterNc6 = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
    expect(fenPly(fenAfterNc6)).toBe(4);
  });

  it("handles malformed or empty FENs safely without throwing", () => {
    expect(fenPly("")).toBe(0);
    // @ts-expect-error test invalid types
    expect(fenPly(null)).toBe(0);
    // @ts-expect-error test invalid types
    expect(fenPly(undefined)).toBe(0);
    expect(fenPly("invalid fen")).toBe(0);
  });

  it("handles FENs with multiple or trailing spaces cleanly", () => {
    const spacedFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR   b   KQkq  e3  0  1";
    expect(fenPly(spacedFen)).toBe(1);
  });
});

