export interface AvatarData {
  piece: string;
  label: string;
  bg: string;
  textColor: string;
}

export const CHESS_PIECE_OPTIONS: Array<{ piece: string; label: string }> = [
  { piece: "👑", label: "Queen" },
  { piece: "♞", label: "Knight" },
  { piece: "🏰", label: "Rook" },
  { piece: "♗", label: "Bishop" },
  { piece: "♚", label: "King" },
  { piece: "♟", label: "Pawn" },
];

export const AVATAR_COLOR_PALETTES: Array<{
  id: string;
  label: string;
  bg: string;
  textColor: string;
}> = [
  { id: "amber", label: "Amber Yellow", bg: "#f5e4b0", textColor: "#5c3800" },
  { id: "peach", label: "Warm Peach", bg: "#f5d4aa", textColor: "#5c2000" },
  { id: "mint", label: "Pale Mint", bg: "#b0e5d0", textColor: "#053d2a" },
  { id: "lavender", label: "Soft Lavender", bg: "#e0dafc", textColor: "#250d54" },
  { id: "sky", label: "Sky Chalk", bg: "#cce8f8", textColor: "#0c385c" },
  { id: "slate", label: "Clay Slate", bg: "#7a6858", textColor: "#fdf8f0" },
];

export const DEFAULT_AVATAR: AvatarData = {
  piece: "♟",
  label: "Pawn",
  bg: "#f5e4b0",
  textColor: "#5c3800",
};

/**
 * Parses user image string into an AvatarData object.
 * If null, invalid, or legacy letter, falls back to the initial letter or default pawn.
 */
export function parseAvatar(image?: string | null, name?: string): AvatarData {
  if (image) {
    try {
      const parsed = JSON.parse(image);
      if (parsed && typeof parsed.piece === "string" && typeof parsed.bg === "string") {
        return {
          piece: parsed.piece,
          label: parsed.label || "Custom Piece",
          bg: parsed.bg,
          textColor: parsed.textColor || "#5c3800",
        };
      }
    } catch {
      // Not JSON, might be a single emoji / piece character
      if (image.length <= 4) {
        return {
          piece: image,
          label: "Custom Piece",
          bg: "#f5e4b0",
          textColor: "#5c3800",
        };
      }
    }
  }

  // Fallback: Initial letter of user's name
  const initial = name ? name.charAt(0).toUpperCase() : "♟";
  return {
    piece: initial,
    label: "Player Initial",
    bg: "#f5e4b0",
    textColor: "#5c3800",
  };
}

export function serializeAvatar(avatar: AvatarData): string {
  return JSON.stringify(avatar);
}
