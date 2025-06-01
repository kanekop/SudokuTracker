import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Board, 
  cellStatus, 
  Difficulty, 
  GameState,
  Cell
} from '@shared/schema';
import {
  createEmptyBoard,
  isBoardComplete,
  isBoardCorrect,
  getBoardErrors,
  hasCellError,
  hasBoardChanged
} from '@/lib/sudoku';

type SudokuHookProps = {
  gameId?: number;
  initialBoard?: Board;
  currentBoard?: Board;
  solvedBoard?: Board;
  difficulty?: Difficulty;
  timeSpent?: number;
  onGameComplete?: (gameState: GameState) => void;
};

export function useSudoku({
  gameId,
  initialBoard,
  currentBoard,
  solvedBoard,
  difficulty = 1,
  timeSpent = 0,
  onGameComplete,
}: SudokuHookProps) {
  const [board, setBoard] = useState<Board>(currentBoard || initialBoard || createEmptyBoard());
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isGameSaved, setIsGameSaved] = useState(!!gameId); // Track if game is already saved to server
  const [gameErrors, setGameErrors] = useState<Set<string>>(new Set());
  const [currentGameId, setCurrentGameId] = useState<number | undefined>(gameId);

  // Initialize the board when currentBoard or initialBoard changes
  useEffect(() => {
    if (currentBoard) {
      setBoard(currentBoard);
      setSelectedCell(null);
      setGameCompleted(false);
    } else if (initialBoard) {
      setBoard(initialBoard);
      setSelectedCell(null);
      setGameCompleted(false);
    }
  }, [currentBoard, initialBoard]);

  // Update gameId when it changes
  useEffect(() => {
    if (gameId) {
      setCurrentGameId(gameId);
      setIsGameSaved(true);
    }
  }, [gameId]);

  // Check for errors in the board
  useEffect(() => {
    setGameErrors(getBoardErrors(board));
  }, [board]);

  // Check if the game is completed
  useEffect(() => {
    if (solvedBoard && isBoardComplete(board) && isBoardCorrect(board, solvedBoard) && !gameCompleted) {
      setGameCompleted(true);

      // Save the completed game immediately
      if (currentGameId) {
        saveGameMutation.mutate({
          currentBoard: board,
          timeSpent: timeSpent,
          isCompleted: true,
        });
      }

      if (onGameComplete && currentGameId) {
        onGameComplete({
          id: currentGameId,
          difficulty: difficulty,
          initialBoard: initialBoard || createEmptyBoard(),
          currentBoard: board,
          solvedBoard: solvedBoard,
          timeSpent: timeSpent,
          isCompleted: true,
          startedAt: new Date(),
          completedAt: new Date(),
        });
      }
    }
  }, [board, solvedBoard, gameCompleted, currentGameId]);

  const createGameMutation = useMutation({
    mutationFn: async (data: {
      difficulty: Difficulty;
      initialBoard: Board;
      currentBoard: Board;
      solvedBoard: Board;
    }) => {
      const response = await apiRequest('POST', '/api/games', data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentGameId(data.id);
      setIsGameSaved(true);
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  const saveGameMutation = useMutation({
    mutationFn: async (data: {
      currentBoard: Board;
      timeSpent: number;
      isCompleted: boolean;
    }) => {
      if (!currentGameId) return null;

      const response = await apiRequest('PATCH', `/api/games/${currentGameId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  const selectCell = (row: number, col: number) => {
    // Cannot select filled cells from the initial board
    if (initialBoard && board[row][col].status === cellStatus.FILLED) {
      return;
    }

    setSelectedCell([row, col]);
  };

  const fillCell = (value: number) => {
    if (!selectedCell) return;

    const [row, col] = selectedCell;

    // Cannot modify filled cells from the initial board
    if (board[row][col].status === cellStatus.FILLED) {
      return;
    }

    // Check if this is the first user input and game needs to be saved
    const shouldCreateGame = !isGameSaved && !currentGameId && initialBoard && solvedBoard;

    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard)) as Board;

      if (isNoteMode) {
        // Handle notes
        const notes = newBoard[row][col].notes || [];
        const noteIndex = notes.indexOf(value);

        if (noteIndex === -1) {
          // Add note
          notes.push(value);
          notes.sort();
        } else {
          // Remove note
          notes.splice(noteIndex, 1);
        }

        newBoard[row][col] = {
          ...newBoard[row][col],
          notes,
        };
      } else {
        // Regular cell filling
        newBoard[row][col] = {
          value: value,
          status: value === 0 ? cellStatus.EMPTY : cellStatus.USER_FILLED,
          notes: [],
        };
      }

      // If this is the first meaningful input, create the game on server
      if (shouldCreateGame && hasBoardChanged(initialBoard, newBoard)) {
        createGameMutation.mutate({
          difficulty,
          initialBoard,
          currentBoard: newBoard,
          solvedBoard,
        });
      }

      return newBoard;
    });
  };

  const eraseCell = () => {
    if (!selectedCell) return;

    const [row, col] = selectedCell;

    // Cannot erase filled cells from the initial board
    if (board[row][col].status === cellStatus.FILLED) {
      return;
    }

    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard)) as Board;
      newBoard[row][col] = {
        value: 0,
        status: cellStatus.EMPTY,
        notes: [],
      };
      return newBoard;
    });
  };

  const toggleNoteMode = () => {
    setIsNoteMode(prev => !prev);
  };

  // Debug mode: auto-solve current puzzle
  const autoSolve = () => {
    if (!solvedBoard) return;
    
    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard)) as Board;
      
      // Only fill empty cells, keep user-filled cells intact
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (newBoard[row][col].value === 0) {
            newBoard[row][col] = {
              value: solvedBoard[row][col].value,
              status: cellStatus.USER_FILLED,
              notes: [],
            };
          }
        }
      }
      
      return newBoard;
    });
  };

  // Hint functionality removed

  const saveGame = (currentTimeSpent: number) => {
    // Only save if the board has been modified from the initial state
    if (initialBoard && hasBoardChanged(initialBoard, board) && currentGameId) {
      saveGameMutation.mutate({
        currentBoard: board,
        timeSpent: currentTimeSpent,
        isCompleted: gameCompleted,
      });
    }
  };

  const isCellError = (row: number, col: number) => {
    return hasCellError(row, col, board, gameErrors);
  };

  return {
    board,
    selectedCell,
    isNoteMode,
    gameCompleted,
    selectCell,
    fillCell,
    eraseCell,
    toggleNoteMode,
    autoSolve,
    saveGame,
    isCellError,
    saveGameMutation,
  };
}