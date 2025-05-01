import { Button } from '@/components/ui/button';

interface NumberPadProps {
  onNumberClick: (num: number) => void;
  selectedNumber?: number;
}

export function NumberPad({ onNumberClick, selectedNumber }: NumberPadProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  return (
    <div className="grid grid-cols-9 gap-2">
      {numbers.map(num => (
        <button
          key={num}
          className={`number-button flex items-center justify-center text-lg font-medium transition-colors ${
            selectedNumber === num
              ? 'bg-primary text-white border border-primary'
              : 'bg-white hover:bg-primary hover:text-white border border-gray-medium'
          } rounded-lg`}
          onClick={() => onNumberClick(num)}
        >
          {num}
        </button>
      ))}
    </div>
  );
}
