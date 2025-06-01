import { useState } from 'react';
import { Difficulty, difficulties } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export function DifficultySelector({ 
  selectedDifficulty, 
  onDifficultyChange 
}: DifficultySelectorProps) {
  // Show only 5 difficulty levels at a time for mobile screens
  const [showAdditionalLevels, setShowAdditionalLevels] = useState(false);
  
  // Visible difficulties based on screen size
  const visibleDifficulties = showAdditionalLevels 
    ? difficulties.slice(5) 
    : difficulties.slice(0, 5);
  
  return (
    <div className="difficulty-controls flex items-center">
      <label className="mr-3 text-gray-700 font-medium">難易度:</label>
      <div className="flex space-x-1">
        {visibleDifficulties.map((level) => (
          <button
            key={level}
            className={`btn-difficulty px-3 py-1 rounded text-sm transition-colors ${
              selectedDifficulty === level
                ? 'active'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => onDifficultyChange(level)}
          >
            {level}
          </button>
        ))}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-gray-500 hover:text-primary p-1"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {showAdditionalLevels ? (
            difficulties.slice(0, 5).map((level) => (
              <DropdownMenuItem 
                key={level}
                onClick={() => onDifficultyChange(level)}
                className={selectedDifficulty === level ? "bg-primary/10" : ""}
              >
                レベル {level}
              </DropdownMenuItem>
            ))
          ) : (
            difficulties.slice(5).map((level) => (
              <DropdownMenuItem 
                key={level}
                onClick={() => onDifficultyChange(level)}
                className={selectedDifficulty === level ? "bg-primary/10" : ""}
              >
                レベル {level}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuItem onClick={() => setShowAdditionalLevels(!showAdditionalLevels)}>
            {showAdditionalLevels ? "レベル 1-5 を表示" : "レベル 6-10 を表示"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
