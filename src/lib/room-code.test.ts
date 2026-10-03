import { describe, it, expect } from "vitest";
import { generateRoomCode } from "./room-code";

describe("generateRoomCode", () => {
  it("generates a 6-character string", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(typeof code).toBe("string");
  });

  it("only contains unambiguous uppercase alphanumeric characters", () => {
    const validChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(validChars);
      // Ensure ambiguous chars (0, O, 1, I, L) are never generated
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it("produces unique codes across multiple iterations", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // High probability all 100 codes are unique
    expect(codes.size).toBe(100);
  });
});
