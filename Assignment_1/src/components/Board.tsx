import type { Swap } from '../types';
import './Board.css';

interface BoardProps {
  board: number[];
  activeSwap: Swap | null;
  animating: boolean;
  animDirection: 'forward' | 'backward';
  completed: boolean;
}

export function Board({
  board,
  activeSwap,
  animating,
  animDirection,
  completed,
}: BoardProps) {
  return (
    <div className={`board-panel${completed ? ' board-panel--done' : ''}`}>
      <div className="board" role="list" aria-label="Checker board">
        {board.map((value, index) => {
          const isLeft = activeSwap?.leftIndex === index;
          const isRight = activeSwap?.rightIndex === index;
          const isActive = Boolean(activeSwap && (isLeft || isRight));

          let animClass = '';
          if (animating && isActive && activeSwap) {
            if (animDirection === 'forward') {
              animClass = isLeft ? 'checker--swap-right' : 'checker--swap-left';
            } else {
              animClass = isLeft ? 'checker--swap-left' : 'checker--swap-right';
            }
          }

          return (
            <div key={index} className="checker-slot" role="listitem">
              <div
                className={[
                  'checker',
                  value === 0 ? 'checker--red' : 'checker--black',
                  isActive ? 'checker--active' : '',
                  animClass,
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
              <span className="checker-index">{index}</span>
            </div>
          );
        })}
      </div>
      {completed && (
        <div className="board-complete" role="status">
          ✓ Completed
        </div>
      )}
    </div>
  );
}
