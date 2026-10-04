import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  rating: integer("rating").default(1200).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    issuer: text("issuer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const gameRooms = pgTable(
  "game_rooms",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    hostUserId: text("host_user_id").references(() => user.id, { onDelete: "set null" }),
    hostName: text("host_name").notNull(),
    guestUserId: text("guest_user_id").references(() => user.id, { onDelete: "set null" }),
    guestName: text("guest_name"),
    hostColor: text("host_color").notNull().default("white"), // "white" | "black" | "random"
    timeControl: integer("time_control").notNull().default(0), // seconds total, 0 = unlimited
    increment: integer("increment").notNull().default(0), // seconds per move
    currentFen: text("current_fen")
      .notNull()
      .default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
    pgn: text("pgn").default(""),
    whiteTimeMs: integer("white_time_ms"), // remaining time for white in ms
    blackTimeMs: integer("black_time_ms"), // remaining time for black in ms
    status: text("status").notNull().default("waiting"), // "waiting" | "in_progress" | "completed" | "abandoned"
    result: text("result"), // "white" | "black" | "draw" | null
    resultReason: text("result_reason"), // "checkmate" | "resignation" | "timeout" | "draw_agreement" | "stalemate" | "abandoned"
    lastMoveAt: timestamp("last_move_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("game_rooms_code_idx").on(table.code)],
);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  opponentType: text("opponent_type").notNull(), // "local" | "bot" | "friend"
  botDifficulty: text("bot_difficulty"), // nullable
  playerColor: text("player_color").notNull(), // "white" | "black"
  player2Name: text("player2_name"), // nullable, for local and friend games
  opponentUserId: text("opponent_user_id").references(() => user.id, { onDelete: "set null" }), // nullable — only for friend games
  roomCode: text("room_code"), // nullable — only for friend games
  result: text("result").notNull(), // "win" | "loss" | "draw"
  ratingBefore: integer("rating_before"), // nullable — only set for rated games
  ratingAfter: integer("rating_after"), // nullable — only set for rated games
  createdAt: timestamp("created_at").defaultNow().notNull(),
});