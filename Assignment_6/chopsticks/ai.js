/**
 * Chopsticks AI — dynamic programming / minimax.
 * Ported from best_move_dp() in Assignment_6/chopsticks.py.
 *
 * Values are always from Player A's perspective:
 *   +1 = A can force a win
 *    0 = tie (with optimal play / depth limit)
 *   -1 = A loses against optimal play
 *
 * Even level (A's turn) → MAX; odd level (B's turn) → MIN.
 * Game legality comes only from game.js.
 */

import {
  nextMoves,
  isDeadHandPair,
  stateKey,
  formatState,
  DEFAULT_DEPTH,
} from "./game.js";

/**
 * @typedef {import("./game.js").GameState} GameState
 * @typedef {{ value: number, bestMove: GameState|null }} DpEntry
 */

/**
 * Build bottom-up DP table for levels depth … 0.
 * @param {number} depth even positive integer (2 * moves)
 * @returns {Map<string, DpEntry>}
 */
export function buildDpTable(depth = DEFAULT_DEPTH) {
  if (depth % 2 !== 0) {
    throw new Error("depth must be even");
  }

  /** @type {Map<string, DpEntry>} */
  const d = new Map();

  // Base cases at level == depth
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < 5; k++) {
        for (let l = 0; l < 5; l++) {
          const state = /** @type {GameState} */ ([
            [i, j],
            [k, l],
            depth,
          ]);
          const key = stateKey(state);
          if (i === 0 && j === 0 && k === 0 && l === 0) {
            d.set(key, { value: 0, bestMove: null });
          } else if (i === 0 && j === 0) {
            d.set(key, { value: -1, bestMove: null });
          } else if (k === 0 && l === 0) {
            d.set(key, { value: 1, bestMove: null });
          } else {
            d.set(key, { value: 0, bestMove: null });
          }
        }
      }
    }
  }

  for (let h = depth - 1; h >= 0; h--) {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        for (let k = 0; k < 5; k++) {
          for (let l = 0; l < 5; l++) {
            const state = /** @type {GameState} */ ([
              [i, j],
              [k, l],
              h,
            ]);
            const key = stateKey(state);

            if (i === 0 && j === 0 && k === 0 && l === 0) {
              d.set(key, { value: 0, bestMove: null });
              continue;
            }
            if (i === 0 && j === 0) {
              d.set(key, { value: -1, bestMove: null });
              continue;
            }
            if (k === 0 && l === 0) {
              d.set(key, { value: 1, bestMove: null });
              continue;
            }

            const successors = nextMoves(state);
            if (successors.length === 0) {
              d.set(key, { value: 0, bestMove: null });
              continue;
            }

            const maximize = h % 2 === 0;
            let bestVal = maximize ? -Infinity : Infinity;
            /** @type {GameState|null} */
            let bestMove = null;

            for (const succ of successors) {
              const entry = d.get(stateKey(succ));
              if (!entry) {
                throw new Error(`Missing DP entry for ${formatState(succ)}`);
              }
              const val = entry.value;
              if (maximize) {
                if (val > bestVal) {
                  bestVal = val;
                  bestMove = succ;
                }
              } else if (val < bestVal) {
                bestVal = val;
                bestMove = succ;
              }
            }

            d.set(key, { value: bestVal, bestMove });
          }
        }
      }
    }
  }

  return d;
}

/**
 * @param {Map<string, DpEntry>} table
 * @param {GameState} state
 * @returns {DpEntry}
 */
export function lookup(table, state) {
  const entry = table.get(stateKey(state));
  if (!entry) {
    throw new Error(`State not in DP table: ${formatState(state)}`);
  }
  return entry;
}

/**
 * @param {number} value from A's perspective
 * @returns {"WIN"|"TIE"|"LOSS"}
 */
export function outcomeLabel(value) {
  if (value === 1) return "WIN";
  if (value === -1) return "LOSS";
  return "TIE";
}

/**
 * Select the computer's optimal move for the current state.
 * @param {GameState} state
 * @param {Map<string, DpEntry>} table
 * @returns {{ move: GameState, value: number }}
 */
export function chooseComputerMove(state, table) {
  if (isDeadHandPair(state[0]) || isDeadHandPair(state[1])) {
    throw new Error("Cannot choose a move from a terminal state.");
  }
  const { value, bestMove } = lookup(table, state);
  if (!bestMove) {
    throw new Error(`No best move stored for ${formatState(state)}`);
  }
  return { move: bestMove, value };
}

/**
 * Educational analysis of the computer's decision at `state`.
 * Values come from the same DP table used to pick the move.
 * @param {GameState} state
 * @param {Map<string, DpEntry>} table
 * @param {"A"|"B"} computerRole
 */
export function analyzeMove(state, table, computerRole) {
  const level = state[2];
  const isMax = level % 2 === 0;
  const { value, bestMove } = lookup(table, state);
  const successors = nextMoves(state);

  const moves = successors.map((succ, index) => {
    const succVal = lookup(table, succ).value;
    const selected =
      bestMove !== null && stateKey(succ) === stateKey(bestMove);
    return {
      index: index + 1,
      state: succ,
      formatted: formatState(succ),
      value: succVal,
      selected,
    };
  });

  return {
    currentState: state,
    formattedState: formatState(state),
    computerRole,
    objective: isMax ? "MAX" : "MIN",
    level,
    moves,
    selectedMove: bestMove,
    selectedFormatted: bestMove ? formatState(bestMove) : null,
    value,
    predictedOutcome: outcomeLabel(value),
  };
}
