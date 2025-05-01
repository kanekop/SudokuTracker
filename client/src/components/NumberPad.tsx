import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface NumberPadProps {
  onNumberClick: (num: number) => void;
  onErase: () => void;
  selectedNumber?: number;
}

export function NumberPad({ onNumberClick, onErase, selectedNumber }: NumberPadProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {numbers.map(num => (
        <button
          key={num}
          className={`number-button flex items-center justify-center text-lg font-medium transition-colors ${
            selectedNumber === num
              ? 'bg-primary text-white border border-primary'
              : 'bg-white hover:bg-primary hover:text-white border border-gray-medium'
          } rounded-lg h-12`}
          onClick={() => onNumberClick(num)}
        >
          {num}
        </button>
      ))}
      {/* Erase button */}
      <button
        className="number-button flex items-center justify-center text-lg font-medium transition-colors 
                 bg-white hover:bg-red-100 text-red-600 hover:text-red-700 border border-gray-medium rounded-lg h-12"
        onClick={onErase}
      >
        <Eraser className="h-5 w-5" />
      </button>
    </div>
  );
}
