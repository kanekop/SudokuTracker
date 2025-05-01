import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Difficulty, GameState } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/hooks/useTimer';
import { useSudoku } from '@/hooks/useSudoku';
import { SudokuBoard } from '@/components/SudokuBoard';
import { NumberPad } from '@/components/NumberPad';
import { GameControls } from '@/components/GameControls';
import { DifficultySelector } from '@/components/DifficultySelector';
import { CompletionModal } from '@/components/CompletionModal';
import { useToast } from '@/hooks/use-toast';
import { generateSudoku } from '@/lib/sudoku';

export default function Game() {
  const { isLoggedIn, user } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [currentGameId, setCurrentGameId] = useState<number | undefined>(undefined);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Local state for non-logged-in users
  const [localGame, setLocalGame] = useState<{ initialBoard: any; solvedBoard: any } | null>(null);
  
  // Timer hook
  const timer = useTimer();
  
  // Generate a local game for non-logged-in users
  useEffect(() => {
    if (!isLoggedIn && !localGame) {
      const newGame = generateSudoku(difficulty);
      setLocalGame(newGame);
      timer.reset();
      timer.start();
    }
  }, [isLoggedIn, difficulty, localGame]);
  
  // This useEffect is removed to avoid conflicts with the one above and the handleDifficultyChange function
  
  // Create a new game
  const createGameMutation = useMutation({
    mutationFn: async (difficulty: Difficulty) => {
      const res = await apiRequest('POST', '/api/games', { difficulty });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentGameId(data.id);
      timer.reset();
      timer.start();
      setLocalGame(null); // Clear local game when server game is created
      
      // Explicitly fetch the new game data immediately
      queryClient.setQueryData(['/api/games', data.id], {
        id: data.id,
        difficulty: data.difficulty,
        initialBoard: data.initialBoard,
        currentBoard: data.currentBoard,
        solvedBoard: data.solvedBoard,
        timeSpent: data.timeSpent,
        isCompleted: data.isCompleted,
        startedAt: data.startedAt,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create a new game',
        variant: 'destructive',
      });
    },
  });
  
  // Load game if ID is provided
  const { data: gameData, isLoading: isGameLoading } = useQuery<GameState>({
    queryKey: ['/api/games', currentGameId],
    enabled: !!currentGameId && isLoggedIn,
  });
  
  // Initialize sudoku hook with game data
  const sudoku = useSudoku({
    gameId: currentGameId,
    initialBoard: gameData?.initialBoard || localGame?.initialBoard,
    solvedBoard: gameData?.solvedBoard || localGame?.solvedBoard,
    difficulty: gameData?.difficulty || difficulty,
    timeSpent: timer.seconds,
    onGameComplete: (gameState) => {
      setIsCompletionModalOpen(true);
      timer.pause();
      // Save the completed game if logged in
      if (isLoggedIn) {
        sudoku.saveGame(timer.seconds);
      }
    },
  });
  
  // Start a new game when difficulty changes or when component mounts for logged-in users
  useEffect(() => {
    if (isLoggedIn && !currentGameId) {
      createGameMutation.mutate(difficulty);
    }
  }, [isLoggedIn, difficulty]);
  
  // Set timer when game data is loaded for logged-in users
  useEffect(() => {
    if (gameData) {
      timer.setTime(gameData.timeSpent);
      if (!gameData.isCompleted) {
        timer.start();
      }
    }
  }, [gameData]);
  
  // Handle game save (auto-save every 30 seconds) for logged-in users
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isLoggedIn && currentGameId && !sudoku.gameCompleted) {
        sudoku.saveGame(timer.seconds);
      }
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, [isLoggedIn, currentGameId, sudoku.gameCompleted, timer.seconds]);
  
  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    if (newDifficulty === difficulty) return;
    
    setDifficulty(newDifficulty);
    if (isLoggedIn) {
      createGameMutation.mutate(newDifficulty);
    } else {
      // For non-logged-in users, generate a new local game
      const newGame = generateSudoku(newDifficulty);
      setLocalGame(newGame);
      timer.reset();
      timer.start();
    }
  };
  
  // Handle new game button
  const handleNewGame = () => {
    if (isLoggedIn) {
      createGameMutation.mutate(difficulty);
    } else {
      // For non-logged-in users, generate a new local game
      const newGame = generateSudoku(difficulty);
      setLocalGame(newGame);
      timer.reset();
      timer.start();
    }
  };
  
  // Handle hint button
  const handleHint = () => {
    const result = sudoku.getHint();
    if (result) {
      toast({
        title: result.success ? "ヒント" : "注意",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    }
  };
  
  // Handle check solution button
  const handleCheckSolution = () => {
    // Check if the board is complete
    if (!sudoku.board || !gameData?.solvedBoard) {
      toast({
        title: "エラー",
        description: "ゲームデータが不完全です",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all cells are filled
    const allCellsFilled = sudoku.board.every(row => 
      row.every(cell => cell.value !== 0)
    );
    
    if (!allCellsFilled) {
      toast({
        title: "未完成",
        description: "すべてのマスを埋めてください",
        variant: "destructive",
      });
      return;
    }
    
    // Check if solution is correct
    const isCorrect = sudoku.gameCompleted;
    
    if (isCorrect) {
      toast({
        title: "正解！",
        description: "完璧なソリューションです！おめでとう！",
        variant: "default",
      });
      // Open the completion modal
      setIsCompletionModalOpen(true);
      timer.pause();
      
      // Save the completed game if logged in
      if (isLoggedIn && currentGameId) {
        sudoku.saveGame(timer.seconds);
      }
    } else {
      toast({
        title: "不正解",
        description: "解答に誤りがあります。赤く表示されたマスを確認してください。",
        variant: "destructive",
      });
    }
  };
  
  // Handle save game
  const handleSaveGame = () => {
    if (isLoggedIn && currentGameId) {
      sudoku.saveGame(timer.seconds);
      toast({
        title: '保存しました',
        description: 'ゲームが正常に保存されました',
      });
    } else {
      toast({
        title: 'サインインが必要です',
        description: 'ゲームを保存するにはサインインしてください',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <>
      {/* Game Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <DifficultySelector
          selectedDifficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
        />
        
        <GameControls
          onErase={sudoku.eraseCell}
          onToggleNoteMode={sudoku.toggleNoteMode}
          onHint={handleHint}
          onSaveGame={handleSaveGame}
          onNewGame={handleNewGame}
          onCheckSolution={handleCheckSolution}
          isNoteMode={sudoku.isNoteMode}
          timeSpent={timer.formattedTime}
        />
      </div>
      
      {/* Sudoku Grid */}
      <div className="flex justify-center">
        <div className="mb-6 max-w-md w-full">
          <SudokuBoard
            board={sudoku.board}
            selectedCell={sudoku.selectedCell}
            onCellSelect={sudoku.selectCell}
            isCellError={sudoku.isCellError}
          />
          
          <NumberPad
            onNumberClick={sudoku.fillCell}
          />
        </div>
      </div>
      
      {/* Completion Modal */}
      <CompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onNewGame={() => {
          setIsCompletionModalOpen(false);
          handleNewGame();
        }}
        difficulty={difficulty}
        timeSpent={timer.seconds}
      />
    </>
  );
}
