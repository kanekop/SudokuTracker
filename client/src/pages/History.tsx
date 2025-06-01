import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserGameHistory, UserStats, Difficulty } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { formatTime } from '@/lib/sudoku';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';

// History filter types
type CompletionFilter = 'all' | 'completed' | 'incomplete';
type DifficultyFilter = 'all' | '1-3' | '4-7' | '8-10';

export default function History() {
  const { isLoggedIn } = useAuth();
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Fetch game history
  const { 
    data: gameHistory = [], 
    isLoading: isHistoryLoading,
    error: historyError
  } = useQuery<UserGameHistory[]>({
    queryKey: ['/api/games'],
    enabled: isLoggedIn,
  });

  // Fetch user stats
  const { 
    data: stats, 
    isLoading: isStatsLoading,
    error: statsError
  } = useQuery<UserStats>({
    queryKey: ['/api/stats'],
    enabled: isLoggedIn,
  });

  // Handle replay/continue game
  const handleReplayGame = (gameId: number, isCompleted: boolean) => {
    // If it's a completed game, add replay parameter
    if (isCompleted) {
      setLocation(`/game/${gameId}?replay=true`);
    } else {
      setLocation(`/game/${gameId}`);
    }
  };

  // Apply filters to game history
  const filteredHistory = gameHistory.filter(game => {
    // Apply completion filter
    if (completionFilter === 'completed' && !game.isCompleted) return false;
    if (completionFilter === 'incomplete' && game.isCompleted) return false;

    // Apply difficulty filter
    if (difficultyFilter === '1-3' && (game.difficulty < 1 || game.difficulty > 3)) return false;
    if (difficultyFilter === '4-7' && (game.difficulty < 4 || game.difficulty > 7)) return false;
    if (difficultyFilter === '8-10' && (game.difficulty < 8 || game.difficulty > 10)) return false;

    return true;
  });

  // Render difficulty indicators
  const renderDifficultyIndicators = (level: Difficulty) => {
    return (
      <span className="inline-flex items-center">
        {[...Array(10)].map((_, i) => (
          <span 
            key={i}
            className={`difficulty-indicator ${i < level ? 'diff-active' : 'diff-inactive'}`}
          />
        ))}
      </span>
    );
  };

  // Format date as YYYY.MM.DD
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '.');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">プレイ履歴</h2>

        {/* History Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            variant={completionFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('all')}
          >
            すべて
          </Button>
          <Button
            variant={completionFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('completed')}
          >
            完了
          </Button>
          <Button
            variant={completionFilter === 'incomplete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('incomplete')}
          >
            未完了
          </Button>

          <div className="ml-auto">
            <Select
              value={difficultyFilter}
              onValueChange={(value) => setDifficultyFilter(value as DifficultyFilter)}
            >
              <SelectTrigger className="w-36 h-8">
                <SelectValue placeholder="すべての難易度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての難易度</SelectItem>
                <SelectItem value="1-3">レベル 1-3</SelectItem>
                <SelectItem value="4-7">レベル 4-7</SelectItem>
                <SelectItem value="8-10">レベル 8-10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-lg border border-gray-medium overflow-hidden">
          {isHistoryLoading ? (
            <div className="p-4 text-center">Loading history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              履歴はありません
            </div>
          ) : (
            filteredHistory.map((game) => (
              <div 
                key={game.id}
                className="history-item p-3 border-b border-gray-medium hover:bg-gray-50 transition-colors last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">{formatDate(game.startedAt)}</h3>
                      <span className={`ml-2 px-2 py-0.5 ${
                        game.isCompleted ? 'bg-success' : 'bg-warning'
                      } text-white text-xs rounded-full`}>
                        {game.isCompleted ? '完了' : '未完了'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      難易度: {renderDifficultyIndicators(game.difficulty)}
                      · 時間: {formatTime(game.timeSpent)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReplayGame(game.id, game.isCompleted)}
                  >
                    {game.isCompleted ? '再プレイ' : '再開'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">統計</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">プレイ回数</h3>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-primary">
                  {isStatsLoading ? '...' : stats?.totalGames || 0}
                </span>
                <span className="ml-2 text-sm text-gray-500">ゲーム</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">完了率</h3>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-success">
                  {isStatsLoading ? '...' : `${Math.round(stats?.completionRate || 0)}%`}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({isStatsLoading ? '...' : `${stats?.completedGames || 0}/${stats?.totalGames || 0}`})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">平均時間</h3>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-primary">
                  {isStatsLoading ? '...' : formatTime(Math.round(stats?.averageTime || 0))}
                </span>
                <span className="ml-2 text-sm text-gray-500">分</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}