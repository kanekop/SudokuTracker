import { Cell, Board, cellStatus, Difficulty } from "@shared/schema";

// Create an empty Sudoku board
export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let i = 0; i < 9; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < 9; j++) {
      row.push({
        value: 0,
        status: cellStatus.EMPTY,
      });
    }
    board.push(row);
  }
  return board;
}

// Check if placing a number in a cell is valid
function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) {
      return false;
    }
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) {
      return false;
    }
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) {
        return false;
      }
    }
  }

  return true;
}

// Generate a solved Sudoku board
function generateSolvedBoard(): number[][] {
  const board: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
  
  function fillBoard(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          // Try placing numbers 1-9
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          // Shuffle numbers for randomness
          for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
          }
          
          for (const num of nums) {
            if (isValidPlacement(board, row, col, num)) {
              board[row][col] = num;
              
              if (fillBoard(board)) {
                return true;
              }
              
              board[row][col] = 0;
            }
          }
          
          return false;
        }
      }
    }
    
    return true;
  }
  
  fillBoard(board);
  return board;
}

// Create a puzzle by removing cells from a solved board
function createPuzzle(solvedBoard: number[][], difficulty: Difficulty): Board {
  // Convert number matrix to Cell matrix
  const initialBoard: Board = solvedBoard.map(row => 
    row.map(value => ({
      value,
      status: cellStatus.FILLED,
    }))
  );
  
  // Number of cells to remove based on difficulty (1-10)
  // Difficulty 1: Remove ~30 cells (easy)
  // Difficulty 10: Remove ~65 cells (very hard)
  const cellsToRemove = 30 + Math.floor((difficulty - 1) * 3.5);
  
  // Create a list of all positions
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Remove cells
  for (let i = 0; i < cellsToRemove; i++) {
    if (i < positions.length) {
      const [row, col] = positions[i];
      initialBoard[row][col] = {
        value: 0,
        status: cellStatus.EMPTY,
      };
    }
  }
  
  return initialBoard;
}

// Generate a Sudoku puzzle with its solution
export function generateSudoku(difficulty: Difficulty): { initialBoard: Board; solvedBoard: Board } {
  const solvedNumberBoard = generateSolvedBoard();
  
  // Convert to Cell board for final solution
  const solvedBoard: Board = solvedNumberBoard.map(row => 
    row.map(value => ({
      value,
      status: cellStatus.FILLED,
    }))
  );
  
  const initialBoard = createPuzzle(solvedNumberBoard, difficulty);
  
  return { initialBoard, solvedBoard };
}

// Check if the board is filled completely
export function isBoardComplete(board: Board): boolean {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j].value === 0) {
        return false;
      }
    }
  }
  return true;
}

// Check if the current board matches the solution
export function isBoardCorrect(currentBoard: Board, solvedBoard: Board): boolean {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (currentBoard[i][j].value !== solvedBoard[i][j].value) {
        return false;
      }
    }
  }
  return true;
}

// Get board errors
export function getBoardErrors(board: Board): Set<string> {
  const errors = new Set<string>();
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    const values = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const value = board[row][col].value;
      if (value !== 0) {
        if (values.has(value)) {
          errors.add(`r${row}c${col}`);
        } else {
          values.add(value);
        }
      }
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    const values = new Set<number>();
    for (let row = 0; row < 9; row++) {
      const value = board[row][col].value;
      if (value !== 0) {
        if (values.has(value)) {
          errors.add(`r${row}c${col}`);
        } else {
          values.add(value);
        }
      }
    }
  }
  
  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const values = new Set<number>();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          const value = board[row][col].value;
          if (value !== 0) {
            if (values.has(value)) {
              errors.add(`r${row}c${col}`);
            } else {
              values.add(value);
            }
          }
        }
      }
    }
  }
  
  return errors;
}

// Solve the Sudoku board
export function solveSudoku(board: Board): Board | null {
  const solvedBoard = JSON.parse(JSON.stringify(board)) as Board;
  const numberBoard = solvedBoard.map(row => row.map(cell => cell.value));
  
  function solve(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(board, row, col, num)) {
              board[row][col] = num;
              
              if (solve(board)) {
                return true;
              }
              
              board[row][col] = 0;
            }
          }
          
          return false;
        }
      }
    }
    
    return true;
  }
  
  if (solve(numberBoard)) {
    // Update the solvedBoard with the solved values
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        solvedBoard[row][col].value = numberBoard[row][col];
        if (board[row][col].value === 0) {
          solvedBoard[row][col].status = cellStatus.USER_FILLED;
        }
      }
    }
    
    return solvedBoard;
  }
  
  return null;
}

// Check if a specific cell has an error
export function hasCellError(row: number, col: number, board: Board, errors: Set<string>): boolean {
  return errors.has(`r${row}c${col}`);
}

// Format time in MM:SS format
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
