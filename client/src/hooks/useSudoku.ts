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
  hasCellError
} from '@/lib/sudoku';

type SudokuHookProps = {
  gameId?: number;
  initialBoard?: Board;
  solvedBoard?: Board;
  difficulty?: Difficulty;
  timeSpent?: number;
  onGameComplete?: (gameState: GameState) => void;
};

export function useSudoku({
  gameId,
  initialBoard,
  solvedBoard,
  difficulty = 1,
  timeSpent = 0,
  onGameComplete,
}: SudokuHookProps) {
  const [board, setBoard] = useState<Board>(initialBoard || createEmptyBoard());
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameErrors, setGameErrors] = useState<Set<string>>(new Set());
  
  // Initialize the board when initialBoard changes
  useEffect(() => {
    if (initialBoard) {
      setBoard(initialBoard);
      setSelectedCell(null);
      setGameCompleted(false);
    }
  }, [initialBoard]);
  
  // Check for errors in the board
  useEffect(() => {
    setGameErrors(getBoardErrors(board));
  }, [board]);
  
  // Check if the game is completed
  useEffect(() => {
    if (solvedBoard && isBoardComplete(board) && isBoardCorrect(board, solvedBoard)) {
      setGameCompleted(true);
      
      if (onGameComplete && gameId) {
        onGameComplete({
          id: gameId,
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
  }, [board, solvedBoard, onGameComplete, gameId, difficulty, initialBoard, timeSpent]);
  
  const saveGameMutation = useMutation({
    mutationFn: async (data: {
      currentBoard: Board;
      timeSpent: number;
      isCompleted: boolean;
    }) => {
      if (!gameId) return null;
      
      const response = await apiRequest('PATCH', `/api/games/${gameId}`, data);
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
  
  const getHint = () => {
    if (!selectedCell || !solvedBoard) {
      // No cell selected or no solved board available
      return { success: false, message: "先にマスを選択してください" }; // Please select a cell first
    }
    
    const [row, col] = selectedCell;
    
    // Cannot get hints for filled cells
    if (board[row][col].status === cellStatus.FILLED) {
      return { success: false, message: "このマスはヒントを与えられません" }; // Can't give hint for this cell
    }
    
    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard)) as Board;
      newBoard[row][col] = {
        value: solvedBoard[row][col].value,
        status: cellStatus.USER_FILLED,
        notes: [],
      };
      return newBoard;
    });
    
    return { success: true, message: "ヒントを表示しました" }; // Hint displayed
  };
  
  const saveGame = (currentTimeSpent: number) => {
    saveGameMutation.mutate({
      currentBoard: board,
      timeSpent: currentTimeSpent,
      isCompleted: gameCompleted,
    });
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
    getHint,
    saveGame,
    isCellError,
    saveGameMutation,
  };
}
