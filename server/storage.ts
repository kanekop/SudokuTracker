import {
  type User, 
  type InsertUser, 
  type Game, 
  type InsertGame, 
  type UserGameHistory, 
  type UserStats,
  type Board
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private userIdCounter: number;
  private gameIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    const game: Game = { ...insertGame, id };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getUserGames(userId: number): Promise<UserGameHistory[]> {
    return Array.from(this.games.values())
      .filter((game) => game.userId === userId)
      .map((game) => ({
        id: game.id,
        difficulty: game.difficulty as number,
        timeSpent: game.timeSpent,
        isCompleted: game.isCompleted,
        startedAt: new Date(game.startedAt),
        completedAt: game.completedAt ? new Date(game.completedAt) : undefined,
      }))
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()); // Sort by date descending
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const userGames = Array.from(this.games.values()).filter(
      (game) => game.userId === userId
    );
    
    const totalGames = userGames.length;
    const completedGames = userGames.filter((game) => game.isCompleted).length;
    const completionRate = totalGames > 0 ? (completedGames / totalGames) * 100 : 0;
    
    const completedGameTimes = userGames
      .filter((game) => game.isCompleted)
      .map((game) => game.timeSpent);
    
    const totalTime = completedGameTimes.reduce((sum, time) => sum + time, 0);
    const averageTime = completedGames > 0 ? totalTime / completedGames : 0;
    
    return {
      totalGames,
      completedGames,
      completionRate,
      averageTime,
    };
  }
}

export const storage = new MemStorage();
