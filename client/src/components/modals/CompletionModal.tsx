import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { Difficulty } from '@shared/schema';
import { formatTime } from '@/lib/sudoku';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGame: () => void;
  difficulty: Difficulty;
  timeSpent: number;
}

export function CompletionModal({
  isOpen,
  onClose,
  onNewGame,
  difficulty,
  timeSpent,
}: CompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">完了!</DialogTitle>
          <DialogDescription className="text-gray-600">
            素晴らしい! 数独を正常に解きました。
          </DialogDescription>
        </DialogHeader>
        
        <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="text-white h-8 w-8" />
        </div>
        
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-left text-gray-500">難易度:</div>
            <div className="text-right font-medium">レベル {difficulty}</div>
            <div className="text-left text-gray-500">時間:</div>
            <div className="text-right font-medium">{formatTime(timeSpent)}</div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={onClose}
            className="mr-2"
          >
            閉じる
          </Button>
          <Button onClick={onNewGame}>
            新しいゲーム
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
