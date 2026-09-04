import type { RecursiveCall, SolutionData, Swap } from '../types';

/**
 * Precompute the full recursive adjacent-swap solution for a given n.
 *
 * Mirrors:
 *   def alternate_checkers(checkers, n, i=0):
 *       if i >= 2 * n - 1: return
 *       if checkers[i] == 0 and checkers[i + 1] == 0:
 *           find next black at j, bubble it left to i+1 via adjacent swaps
 *       alternate_checkers(checkers, n, i + 2)
 */
export function generateSolution(n: number): SolutionData {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('n must be a positive integer');
  }

  const initialBoard = [...Array(n).fill(0), ...Array(n).fill(1)];
  const targetBoard = Array.from({ length: 2 * n }, (_, i) => i % 2);
  const board = [...initialBoard];

  const boardHistory: number[][] = [initialBoard.slice()];
  const swaps: Swap[] = [];
  const recursiveCalls: RecursiveCall[] = [];

  let nextSwapId = 1;
  let nextCallId = 1;

  function alternateCheckers(i: number, depth: number, parentId?: number): void {
    const callId = nextCallId++;
    const isBase = i >= 2 * n - 1;
    const enteredAtStep = boardHistory.length - 1;

    const call: RecursiveCall = {
      id: callId,
      index: i,
      depth,
      parentId,
      status: isBase ? 'base' : 'active',
      swapIds: [],
      pair: null,
      enteredAtStep,
      localDoneAtStep: enteredAtStep,
      completedAtStep: enteredAtStep,
    };
    recursiveCalls.push(call);

    if (isBase) {
      return;
    }

    call.pair = [board[i], board[i + 1]];

    if (board[i] === 0 && board[i + 1] === 0) {
      let j = i + 2;
      while (j < board.length && board[j] === 0) {
        j += 1;
      }

      while (j > i + 1) {
        const leftIndex = j - 1;
        const rightIndex = j;
        ;[board[leftIndex], board[rightIndex]] = [board[rightIndex], board[leftIndex]];

        const swap: Swap = {
          id: nextSwapId++,
          leftIndex,
          rightIndex,
          callId,
          callDepth: depth,
          boardState: board.slice(),
        };
        swaps.push(swap);
        call.swapIds.push(swap.id);
        boardHistory.push(board.slice());
        j -= 1;
      }
    }

    call.localDoneAtStep = boardHistory.length - 1;
    call.status = 'returned';
    alternateCheckers(i + 2, depth + 1, callId);
    call.completedAtStep = boardHistory.length - 1;
  }

  alternateCheckers(0, 0);

  for (const swap of swaps) {
    if (Math.abs(swap.leftIndex - swap.rightIndex) !== 1) {
      throw new Error(`Non-adjacent swap detected: ${swap.leftIndex} ↔ ${swap.rightIndex}`);
    }
  }

  const final = boardHistory[boardHistory.length - 1];
  if (final.join(',') !== targetBoard.join(',')) {
    throw new Error(`Algorithm failed for n=${n}: got [${final}], want [${targetBoard}]`);
  }

  return {
    n,
    initialBoard,
    targetBoard,
    boardHistory,
    swaps,
    recursiveCalls,
  };
}

export function expectedSwapCount(n: number): number {
  return (n * (n - 1)) / 2;
}

/** Derive call status relative to the currently viewed history step. */
export function callStatusAtStep(
  call: RecursiveCall,
  currentStep: number,
): 'pending' | 'active' | 'returned' | 'base' {
  if (call.status === 'base') {
    if (currentStep < call.enteredAtStep) return 'pending';
    return 'base';
  }
  if (currentStep < call.enteredAtStep) return 'pending';
  // Local swaps still in progress for this call.
  if (currentStep < call.localDoneAtStep) return 'active';
  // Viewing a step produced by this call's final local swap.
  if (
    call.swapIds.length > 0 &&
    currentStep === call.localDoneAtStep &&
    currentStep > call.enteredAtStep
  ) {
    return 'active';
  }
  return 'returned';
}
