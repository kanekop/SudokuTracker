import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export const difficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type Difficulty = typeof difficulties[number];

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  difficulty: integer("difficulty").notNull(),
  initialBoard: text("initial_board").notNull(), // JSON string of 9x9 board
  currentBoard: text("current_board").notNull(), // JSON string of 9x9 board
  solvedBoard: text("solved_board").notNull(), // JSON string of 9x9 board
  timeSpent: integer("time_spent").default(0), // in seconds
  isCompleted: boolean("is_completed").default(false),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
});

export const updateGameSchema = createInsertSchema(games).pick({
  currentBoard: true,
  timeSpent: true,
  isCompleted: true,
  completedAt: true,
});

export const cellStatus = {
  EMPTY: 0,
  FILLED: 1, // Given at the start
  USER_FILLED: 2,
  ERROR: 3,
} as const;

export type CellStatus = typeof cellStatus[keyof typeof cellStatus];

export type Cell = {
  value: number;
  status: CellStatus;
  notes?: number[];
};

export type Board = Cell[][];

export type GameState = {
  id?: number;
  difficulty: Difficulty;
  initialBoard: Board;
  currentBoard: Board;
  solvedBoard: Board;
  timeSpent: number;
  isCompleted: boolean;
  startedAt: Date;
  completedAt?: Date;
};

export type UserGameHistory = {
  id: number;
  difficulty: Difficulty;
  timeSpent: number;
  isCompleted: boolean;
  startedAt: Date;
  completedAt?: Date;
};

export type UserStats = {
  totalGames: number;
  completedGames: number;
  completionRate: number;
  averageTime: number; // in seconds
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
