import { Button } from '@/components/ui/button';
import { Pencil, LightbulbIcon, Save, RefreshCw, CheckCircle } from 'lucide-react';

interface GameControlsProps {
  onToggleNoteMode: () => void;
  onHint: () => void;
  onSaveGame: () => void;
  onNewGame: () => void;
  onCheckSolution: () => void;
  isNoteMode: boolean;
}

export function GameControls({
  onToggleNoteMode,
  onHint,
  onSaveGame,
  onNewGame,
  onCheckSolution,
  isNoteMode
}: GameControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-full"
        onClick={onSaveGame}
      >
        <Save className="mr-2 h-4 w-4" />
        <span>保存</span>
      </Button>
      
      <Button
        className="bg-primary hover:bg-blue-600 text-white w-full"
        onClick={onNewGame}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>新規</span>
      </Button>
      
      <Button
        variant="outline"
        className={`${
          isNoteMode 
            ? 'bg-primary text-white border-primary'
            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-medium'
        } w-full`}
        onClick={onToggleNoteMode}
        title="メモモードに切り替え: 1つのマスに複数の候補を記入できます"
      >
        <Pencil className="mr-2 h-4 w-4" />
        <span>メモ</span>
      </Button>
      
      <Button
        variant="outline"
        className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-medium w-full"
        onClick={onHint}
        title="ヒント: 選択したマスに正解の数字を表示します"
      >
        <LightbulbIcon className="mr-2 h-4 w-4" />
        <span>ヒント</span>
      </Button>
      
      <Button
        variant="outline"
        className="bg-green-100 hover:bg-green-200 text-green-700 border border-green-500 w-full"
        onClick={onCheckSolution}
        title="解答を確認: 現在の解答が正しいかチェックします"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        <span>確認</span>
      </Button>
    </div>
  );
}
