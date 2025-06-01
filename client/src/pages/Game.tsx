import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Difficulty, GameState } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/hooks/useTimer';
import { useSudoku } from '@/hooks/useSudoku';
import { SudokuBoard, NumberPad, GameControls, DifficultySelector } from '@/components/game';
import { CompletionModal } from '@/components/modals';
import { useToast } from '@/hooks/use-toast';
import { generateSudoku, isBoardCorrect } from '@/lib/sudoku';

export default function Game() {
  const { isLoggedIn, user } = useAuth();
  const [match, params] = useRoute('/game/:gameId');
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [currentGameId, setCurrentGameId] = useState<number | undefined>(
    params?.gameId ? parseInt(params.gameId) : undefined
  );
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Local state for non-logged-in users
  const [localGame, setLocalGame] = useState<{ initialBoard: any; solvedBoard: any; currentBoard?: any } | null>(null);
  
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
    mutationFn: async (params: { difficulty: Difficulty }) => {
      const res = await apiRequest('POST', '/api/games', { difficulty: params.difficulty });
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
    currentBoard: gameData?.currentBoard || localGame?.currentBoard,
    solvedBoard: gameData?.solvedBoard || localGame?.solvedBoard,
    difficulty: gameData?.difficulty || difficulty,
    timeSpent: timer.seconds,
    onGameComplete: (gameState) => {
      setIsCompletionModalOpen(true);
      timer.pause();
      
      // Handle completion for logged in users
      if (isLoggedIn) {
        if (currentGameId) {
          // Game already exists on server, just update it
          sudoku.saveGame(timer.seconds);
        } else if (localGame) {
          // New game completed - create and save with completed state
          const completedGameState = {
            difficulty,
            initialBoard: localGame.initialBoard,
            currentBoard: sudoku.board,
            solvedBoard: localGame.solvedBoard,
            timeSpent: timer.seconds,
            isCompleted: true,
            startedAt: new Date(),
            completedAt: new Date(),
          };
          
          // Create game on server with completed state
          apiRequest('POST', '/api/games', completedGameState)
            .then(res => res.json())
            .then(data => {
              setCurrentGameId(data.id);
              setLocalGame(null);
              queryClient.invalidateQueries({ queryKey: ['/api/games'] });
            })
            .catch(error => {
              console.error('Failed to save completed game:', error);
            });
        }
      }
    },
  });
  
  // Start a new game when difficulty changes or when component mounts for logged-in users
  useEffect(() => {
    if (isLoggedIn && !currentGameId) {
      // Don't create game on server yet, let the user start playing first
      const newGame = generateSudoku(difficulty);
      setLocalGame(newGame);
      timer.reset();
      timer.start();
    }
  }, [isLoggedIn, difficulty]);
  
  // Debug mode: keyboard shortcut to auto-solve
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+D to auto-solve (debug mode)
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        sudoku.autoSolve();
        toast({
          title: 'デバッグモード',
          description: 'パズルを自動解決しました',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sudoku.autoSolve]);
  
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
  }, [isLoggedIn, currentGameId, sudoku.gameCompleted]);
  
  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    if (newDifficulty === difficulty) return;
    
    setDifficulty(newDifficulty);
    setCurrentGameId(undefined); // Clear current game ID
    const newGame = generateSudoku(newDifficulty);
    setLocalGame(newGame);
    timer.reset();
    timer.start();
  };
  
  // Handle new game button
  const handleNewGame = () => {
    setCurrentGameId(undefined); // Clear current game ID
    const newGame = generateSudoku(difficulty);
    setLocalGame(newGame);
    timer.reset();
    timer.start();
  };
  
  // Hint functionality removed
  
  // Handle check solution button
  const handleCheckSolution = () => {
    // First check if we need to create the game on server
    if (isLoggedIn && !currentGameId && localGame) {
      // Create game on server first, then check solution
      createGameMutation.mutate({ difficulty });
      toast({
        title: "情報",
        description: "ゲームを保存してから確認します",
      });
      return;
    }

    // Get the solved board from current game data or local game
    const currentSolvedBoard = gameData?.solvedBoard || localGame?.solvedBoard;
    
    // For loaded games, the solved board should always be available
    if (!sudoku.board) {
      toast({
        title: "エラー",
        description: "ゲーム盤面が読み込まれていません",
        variant: "destructive",
      });
      return;
    }

    if (!currentSolvedBoard) {
      toast({
        title: "エラー",
        description: "解答データが見つかりません",
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
    
    // Check if solution is correct using the solved board
    const isCorrect = isBoardCorrect(sudoku.board, currentSolvedBoard);
    
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
      {/* Difficulty selector at the top */}
      <div className="mb-4">
        <DifficultySelector
          selectedDifficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
        />
      </div>
      
      {/* Main game area with board on left and controls on right */}
      <div className="flex flex-col md:flex-row justify-start items-start gap-6">
        <div className="mb-6 w-full md:max-w-md">
          {/* Sudoku Grid */}
          <SudokuBoard
            board={sudoku.board}
            selectedCell={sudoku.selectedCell}
            onCellSelect={sudoku.selectCell}
            isCellError={sudoku.isCellError}
          />
          
          <NumberPad
            onNumberClick={sudoku.fillCell}
            onErase={sudoku.eraseCell}
          />
        </div>
        
        {/* Game Controls - vertical on mobile, vertical on desktop */}
        <div className="flex flex-col gap-3 md:mt-0">
          <GameControls
            onToggleNoteMode={sudoku.toggleNoteMode}
            onSaveGame={handleSaveGame}
            onNewGame={handleNewGame}
            onCheckSolution={handleCheckSolution}
            isNoteMode={sudoku.isNoteMode}
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
