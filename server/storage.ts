import {
  type User, 
  type InsertUser, 
  type Game, 
  type InsertGame, 
  type UserGameHistory, 
  type UserStats,
  type Difficulty,
  users,
  games,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, avg, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getUserGames(userId: number): Promise<UserGameHistory[]>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
  getUserStats(userId: number): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getUserGames(userId: number): Promise<UserGameHistory[]> {
    const userGames = await db
      .select({
        id: games.id,
        difficulty: games.difficulty,
        timeSpent: games.timeSpent,
        isCompleted: games.isCompleted,
        startedAt: games.startedAt,
        completedAt: games.completedAt,
      })
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.startedAt));
    
    return userGames.map(game => ({
      id: game.id,
      difficulty: game.difficulty as Difficulty,
      timeSpent: game.timeSpent ?? 0,
      isCompleted: game.isCompleted ?? false,
      startedAt: new Date(game.startedAt),
      completedAt: game.completedAt ? new Date(game.completedAt) : undefined,
    }));
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const [updatedGame] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    
    return updatedGame;
  }

  async getUserStats(userId: number): Promise<UserStats> {
    // Count total games
    const [totalGamesResult] = await db
      .select({ value: count() })
      .from(games)
      .where(eq(games.userId, userId));
    
    const totalGames = totalGamesResult?.value || 0;
    
    // Count completed games
    const [completedGamesResult] = await db
      .select({ value: count() })
      .from(games)
      .where(and(
        eq(games.userId, userId),
        eq(games.isCompleted, true)
      ));
    
    const completedGames = completedGamesResult?.value || 0;
    
    // Calculate completion rate
    const completionRate = totalGames > 0 ? (completedGames / totalGames) * 100 : 0;
    
    // Calculate average time for completed games
    const [averageTimeResult] = await db
      .select({ value: avg(games.timeSpent) })
      .from(games)
      .where(and(
        eq(games.userId, userId),
        eq(games.isCompleted, true)
      ));
    
    const averageTime = averageTimeResult?.value || 0;
    
    return {
      totalGames,
      completedGames,
      completionRate,
      averageTime,
    };
  }
}

export const storage = new DatabaseStorage();
