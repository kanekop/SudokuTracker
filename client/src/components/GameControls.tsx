import { Button } from '@/components/ui/button';
import { Eraser, Pencil, LightbulbIcon, Save, RefreshCw, Clock } from 'lucide-react';

interface GameControlsProps {
  onErase: () => void;
  onToggleNoteMode: () => void;
  onHint: () => void;
  onSaveGame: () => void;
  onNewGame: () => void;
  isNoteMode: boolean;
  timeSpent: string;
}

export function GameControls({
  onErase,
  onToggleNoteMode,
  onHint,
  onSaveGame,
  onNewGame,
  isNoteMode,
  timeSpent
}: GameControlsProps) {
  return (
    <>
      <div className="game-actions flex items-center space-x-2">
        <div className="timer bg-white px-3 py-1 rounded-lg border border-gray-medium flex items-center">
          <Clock className="mr-2 h-4 w-4 text-secondary" />
          <span id="timer" className="font-mono">{timeSpent}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-200 hover:bg-gray-300 text-gray-700"
          onClick={onSaveGame}
        >
          <Save className="mr-2 h-4 w-4" />
          <span>保存</span>
        </Button>
        <Button
          size="sm"
          className="bg-primary hover:bg-blue-600 text-white"
          onClick={onNewGame}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>新規</span>
        </Button>
      </div>
      
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant="outline"
          className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-medium"
          onClick={onErase}
        >
          <Eraser className="mr-2 h-4 w-4" />
          <span>消去</span>
        </Button>
        <Button
          variant="outline"
          className={`${
            isNoteMode 
              ? 'bg-primary text-white border-primary'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-medium'
          }`}
          onClick={onToggleNoteMode}
        >
          <Pencil className="mr-2 h-4 w-4" />
          <span>メモ</span>
        </Button>
        <Button
          variant="outline"
          className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-medium"
          onClick={onHint}
        >
          <LightbulbIcon className="mr-2 h-4 w-4" />
          <span>ヒント</span>
        </Button>
      </div>
    </>
  );
}
