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

export default function Game() {
  const { isLoggedIn, user } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [currentGameId, setCurrentGameId] = useState<number | undefined>(undefined);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Timer hook
  const timer = useTimer();
  
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
    initialBoard: gameData?.initialBoard,
    solvedBoard: gameData?.solvedBoard,
    difficulty: gameData?.difficulty || difficulty,
    timeSpent: timer.seconds,
    onGameComplete: (gameState) => {
      setIsCompletionModalOpen(true);
      timer.pause();
      // Save the completed game
      sudoku.saveGame(timer.seconds);
    },
  });
  
  // Start a new game when difficulty changes or when component mounts
  useEffect(() => {
    if (isLoggedIn && !currentGameId) {
      createGameMutation.mutate(difficulty);
    }
  }, [isLoggedIn, difficulty]);
  
  // Set timer when game data is loaded
  useEffect(() => {
    if (gameData) {
      timer.setTime(gameData.timeSpent);
      if (!gameData.isCompleted) {
        timer.start();
      }
    }
  }, [gameData]);
  
  // Handle game save (auto-save every 30 seconds)
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
    }
  };
  
  // Handle new game button
  const handleNewGame = () => {
    if (isLoggedIn) {
      createGameMutation.mutate(difficulty);
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
          onHint={sudoku.getHint}
          onSaveGame={handleSaveGame}
          onNewGame={handleNewGame}
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
