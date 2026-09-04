export interface Swap {
  id: number;
  leftIndex: number;
  rightIndex: number;
  callId: number;
  callDepth: number;
  boardState: number[];
}

export interface RecursiveCall {
  id: number;
  index: number;
  depth: number;
  parentId?: number;
  status: 'active' | 'returned' | 'base';
  swapIds: number[];
  pair: [number, number] | null;
  /** History step when this call is entered. */
  enteredAtStep: number;
  /** History step when this call finishes its local swaps. */
  localDoneAtStep: number;
  /** History step when this call (and its subtree) finishes. */
  completedAtStep: number;
}

export interface SolutionData {
  n: number;
  initialBoard: number[];
  targetBoard: number[];
  boardHistory: number[][];
  swaps: Swap[];
  recursiveCalls: RecursiveCall[];
}

export const MAX_N = 20;
export const PLAY_DELAY_MS = 700;
export const SWAP_ANIM_MS = 450;
