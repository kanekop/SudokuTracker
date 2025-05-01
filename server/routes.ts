import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertGameSchema, 
  updateGameSchema,
  difficulties
} from "@shared/schema";
import { generateSudoku, solveSudoku } from "../client/src/lib/sudoku";

export async function registerRoutes(app: Express): Promise<Server> {
  // User authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Check if user exists
      let user = await storage.getUserByUsername(username);
      
      // If user doesn't exist, create a new one
      if (!user) {
        const parsed = insertUserSchema.safeParse({ username });
        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid username" });
        }
        
        user = await storage.createUser({ username });
      }
      
      // Set user in session
      if (!req.session) {
        return res.status(500).json({ message: "Session not available" });
      }
      
      req.session.userId = user.id;
      
      return res.status(200).json({ user });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({ user });
    } catch (error) {
      console.error("Auth me error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        
        return res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      return res.status(200).json({ message: "Already logged out" });
    }
  });
  
  // Game routes
  app.post("/api/games", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { difficulty } = req.body;
      
      if (!difficulty || !difficulties.includes(Number(difficulty))) {
        return res.status(400).json({ message: "Invalid difficulty level" });
      }
      
      // Generate a new sudoku puzzle
      const { initialBoard, solvedBoard } = generateSudoku(difficulty);
      
      const gameData = {
        userId: req.session.userId,
        difficulty,
        initialBoard: JSON.stringify(initialBoard),
        currentBoard: JSON.stringify(initialBoard),
        solvedBoard: JSON.stringify(solvedBoard),
        timeSpent: 0,
        isCompleted: false,
        startedAt: new Date(),
      };
      
      const parsed = insertGameSchema.safeParse(gameData);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid game data", errors: parsed.error });
      }
      
      const game = await storage.createGame(gameData);
      
      return res.status(201).json({
        id: game.id,
        difficulty: game.difficulty,
        initialBoard: JSON.parse(game.initialBoard),
        currentBoard: JSON.parse(game.currentBoard),
        solvedBoard: JSON.parse(game.solvedBoard),
        timeSpent: game.timeSpent,
        isCompleted: game.isCompleted,
        startedAt: game.startedAt,
      });
    } catch (error) {
      console.error("Create game error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/games/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const gameId = Number(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this game" });
      }
      
      return res.status(200).json({
        id: game.id,
        difficulty: game.difficulty,
        initialBoard: JSON.parse(game.initialBoard),
        currentBoard: JSON.parse(game.currentBoard),
        solvedBoard: JSON.parse(game.solvedBoard),
        timeSpent: game.timeSpent,
        isCompleted: game.isCompleted,
        startedAt: game.startedAt,
        completedAt: game.completedAt,
      });
    } catch (error) {
      console.error("Get game error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/games/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const gameId = Number(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to update this game" });
      }
      
      const { currentBoard, timeSpent, isCompleted } = req.body;
      
      const updates: Partial<typeof game> = {};
      
      if (currentBoard) {
        updates.currentBoard = JSON.stringify(currentBoard);
      }
      
      if (timeSpent !== undefined) {
        updates.timeSpent = timeSpent;
      }
      
      if (isCompleted !== undefined) {
        updates.isCompleted = isCompleted;
        if (isCompleted) {
          updates.completedAt = new Date();
        }
      }
      
      const parsed = updateGameSchema.partial().safeParse(updates);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid update data" });
      }
      
      const updatedGame = await storage.updateGame(gameId, updates);
      
      return res.status(200).json({
        id: updatedGame!.id,
        difficulty: updatedGame!.difficulty,
        initialBoard: JSON.parse(updatedGame!.initialBoard),
        currentBoard: JSON.parse(updatedGame!.currentBoard),
        solvedBoard: JSON.parse(updatedGame!.solvedBoard),
        timeSpent: updatedGame!.timeSpent,
        isCompleted: updatedGame!.isCompleted,
        startedAt: updatedGame!.startedAt,
        completedAt: updatedGame!.completedAt,
      });
    } catch (error) {
      console.error("Update game error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/games", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userGames = await storage.getUserGames(req.session.userId);
      
      return res.status(200).json(userGames);
    } catch (error) {
      console.error("Get user games error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const stats = await storage.getUserStats(req.session.userId);
      
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Get user stats error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
