import { Board, cellStatus } from '@shared/schema';

interface SudokuBoardProps {
  board: Board;
  selectedCell: [number, number] | null;
  onCellSelect: (row: number, col: number) => void;
  isCellError: (row: number, col: number) => boolean;
}

export function SudokuBoard({ 
  board, 
  selectedCell, 
  onCellSelect,
  isCellError
}: SudokuBoardProps) {
  return (
    <div className="sudoku-grid grid grid-cols-9 w-full mb-6">
      {board.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="sudoku-row contents">
          {row.map((cell, colIndex) => {
            // Determine cell classes
            const isSelected = selectedCell && 
              selectedCell[0] === rowIndex && 
              selectedCell[1] === colIndex;
            
            const cellClasses = [
              'sudoku-cell',
              cell.status === cellStatus.FILLED ? 'cell-filled' : '',
              cell.status === cellStatus.USER_FILLED ? 'cell-user-filled' : '',
              isCellError(rowIndex, colIndex) ? 'cell-error' : '',
              isSelected ? 'cell-selected' : '',
            ].filter(Boolean).join(' ');
            
            return (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className={cellClasses}
                onClick={() => onCellSelect(rowIndex, colIndex)}
              >
                {cell.value !== 0 ? cell.value : ''}
                
                {/* Display cell notes */}
                {cell.value === 0 && cell.notes && cell.notes.length > 0 && (
                  <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full p-0.5 text-[8px] sm:text-[10px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <div key={num} className="flex items-center justify-center">
                        {cell.notes.includes(num) ? num : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
