/**
 * Chopsticks game engine — single source of truth for rules.
 * Ported from Assignment_6/chopsticks.py (overflow_sum, next_moves, terminals).
 *
 * State: ((A_left, A_right), (B_left, B_right), level)
 * Even level → Player A's turn; odd level → Player B's turn.
 */

export const INITIAL_STATE = Object.freeze([[1, 1], [1, 1], 0]);
export const DEFAULT_MOVES = 10;
export const DEFAULT_DEPTH = DEFAULT_MOVES * 2;

/** @typedef {[number, number]} Hand */
/** @typedef {[Hand, Hand, number]} GameState */

/**
 * Add fingers with Chopsticks overflow: sum >= 5 becomes 0.
 * Mirrors overflow_sum in chopsticks.py.
 * @param {number} a
 * @param {number} b
 * @returns {number|undefined}
 */
export function overflowSum(a, b) {
  if (a > 5 || b > 5 || a < 0 || b < 0) {
    return undefined;
  }
  if (a + b >= 5) {
    return 0;
  }
  return a + b;
}

/**
 * @param {unknown} hand
 * @returns {hand is Hand}
 */
export function isValidHand(hand) {
  return (
    Array.isArray(hand) &&
    hand.length === 2 &&
    Number.isInteger(hand[0]) &&
    Number.isInteger(hand[1]) &&
    hand[0] >= 0 &&
    hand[0] <= 4 &&
    hand[1] >= 0 &&
    hand[1] <= 4
  );
}

/**
 * @param {unknown} state
 * @returns {state is GameState}
 */
export function isValidState(state) {
  return (
    Array.isArray(state) &&
    state.length === 3 &&
    isValidHand(state[0]) &&
    isValidHand(state[1]) &&
    Number.isInteger(state[2]) &&
    state[2] >= 0
  );
}

/**
 * @param {Hand} hand
 * @returns {boolean}
 */
export function isDeadHandPair(hand) {
  return hand[0] === 0 && hand[1] === 0;
}

/**
 * @param {GameState} state
 * @returns {boolean}
 */
export function isTerminalState(state) {
  return isDeadHandPair(state[0]) || isDeadHandPair(state[1]);
}

/**
 * Whose turn: "A" on even level, "B" on odd.
 * @param {GameState} state
 * @returns {"A"|"B"}
 */
export function currentPlayer(state) {
  return state[2] % 2 === 0 ? "A" : "B";
}

/**
 * All legal successor states. Faithful port of next_moves().
 * @param {GameState} v
 * @returns {GameState[]}
 */
export function nextMoves(v) {
  if (isDeadHandPair(v[0]) || isDeadHandPair(v[1])) {
    return [];
  }

  const [l0, r0] = v[0];
  const [l1, r1] = v[1];
  const h = v[2];
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {GameState[]} */
  const L = [];

  /**
   * @param {GameState} item
   */
  function add(item) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      L.push(item);
    }
  }

  if (h % 2 === 0) {
    // Player A attacks / redistributes
    if (l0 > 0 && l1 > 0) {
      add([
        [l0, r0],
        [overflowSum(l0, l1), r1],
        h + 1,
      ]);
    }
    if (l0 > 0 && r1 > 0) {
      add([
        [l0, r0],
        [l1, overflowSum(l0, r1)],
        h + 1,
      ]);
    }
    if (r0 > 0 && l1 > 0) {
      add([
        [l0, r0],
        [overflowSum(r0, l1), r1],
        h + 1,
      ]);
    }
    if (r0 > 0 && r1 > 0) {
      add([
        [l0, r0],
        [l1, overflowSum(r0, r1)],
        h + 1,
      ]);
    }

    for (let i = 1; i <= l0; i++) {
      const l = l0 - i;
      if (r0 + i < 5) {
        const r = overflowSum(r0, i);
        if (!(r === l0 && l === r0)) {
          add([
            [l, r],
            [l1, r1],
            h + 1,
          ]);
        }
      }
    }
    for (let i = 1; i <= r0; i++) {
      const l = overflowSum(l0, i);
      const r = r0 - i;
      if (l0 + i < 5) {
        if (!(r === l0 && l === r0)) {
          add([
            [l, r],
            [l1, r1],
            h + 1,
          ]);
        }
      }
    }
  } else {
    // Player B attacks / redistributes
    if (l1 > 0 && l0 > 0) {
      add([
        [overflowSum(l0, l1), r0],
        [l1, r1],
        h + 1,
      ]);
    }
    if (l1 > 0 && r0 > 0) {
      add([
        [l0, overflowSum(r0, l1)],
        [l1, r1],
        h + 1,
      ]);
    }
    if (r1 > 0 && l0 > 0) {
      add([
        [overflowSum(l0, r1), r0],
        [l1, r1],
        h + 1,
      ]);
    }
    if (r1 > 0 && r0 > 0) {
      add([
        [l0, overflowSum(r0, r1)],
        [l1, r1],
        h + 1,
      ]);
    }

    for (let i = 1; i <= l1; i++) {
      const l = l1 - i;
      const r = overflowSum(r1, i);
      if (r1 + i < 5) {
        if (!(r === l1 && l === r1)) {
          add([
            [l0, r0],
            [l, r],
            h + 1,
          ]);
        }
      }
    }
    for (let i = 1; i <= r1; i++) {
      const l = overflowSum(l1, i);
      const r = r1 - i;
      if (l1 + i < 5) {
        if (!(r === l1 && l === r1)) {
          add([
            [l0, r0],
            [l, r],
            h + 1,
          ]);
        }
      }
    }
  }

  return L;
}

/**
 * Hands equal (same left/right counts).
 * @param {Hand} a
 * @param {Hand} b
 */
function handsEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Classify successors from nextMoves — does not invent new rules.
 * Attack: current player's hands unchanged, opponent's hands changed.
 * Redistribution: current player's hands changed, opponent's unchanged.
 * @param {GameState} state
 * @returns {{ attacks: GameState[], redistributions: GameState[] }}
 */
export function classifyMoves(state) {
  const player = currentPlayer(state);
  const attacks = [];
  const redistributions = [];

  for (const succ of nextMoves(state)) {
    const selfSame =
      player === "A"
        ? handsEqual(state[0], succ[0])
        : handsEqual(state[1], succ[1]);
    const oppSame =
      player === "A"
        ? handsEqual(state[1], succ[1])
        : handsEqual(state[0], succ[0]);

    if (selfSame && !oppSame) {
      attacks.push(succ);
    } else if (!selfSame && oppSame) {
      redistributions.push(succ);
    }
  }

  return { attacks, redistributions };
}

/**
 * @param {GameState} state
 * @returns {GameState[]}
 */
export function legalAttacks(state) {
  return classifyMoves(state).attacks;
}

/**
 * @param {GameState} state
 * @returns {GameState[]}
 */
export function legalRedistributions(state) {
  return classifyMoves(state).redistributions;
}

/**
 * True if successor is among nextMoves(state).
 * @param {GameState} state
 * @param {GameState} successor
 */
export function isLegalMove(state, successor) {
  const key = JSON.stringify(successor);
  return nextMoves(state).some((m) => JSON.stringify(m) === key);
}

/**
 * Apply a legal successor. Throws if not legal.
 * @param {GameState} state
 * @param {GameState} successor
 * @returns {GameState}
 */
export function applyMove(state, successor) {
  if (!isLegalMove(state, successor)) {
    throw new Error("Illegal move for current state.");
  }
  return cloneState(successor);
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function cloneState(state) {
  return [
    [state[0][0], state[0][1]],
    [state[1][0], state[1][1]],
    state[2],
  ];
}

/**
 * Game outcome from A's perspective once play stops.
 * @param {GameState} state
 * @param {number} depth
 * @returns {{ status: "ongoing"|"win_a"|"win_b"|"tie", value: number|null }}
 */
export function evaluateOutcome(state, depth) {
  if (isDeadHandPair(state[0]) && isDeadHandPair(state[1])) {
    return { status: "tie", value: 0 };
  }
  if (isDeadHandPair(state[0])) {
    return { status: "win_b", value: -1 };
  }
  if (isDeadHandPair(state[1])) {
    return { status: "win_a", value: 1 };
  }
  if (state[2] >= depth) {
    return { status: "tie", value: 0 };
  }
  return { status: "ongoing", value: null };
}

/**
 * Stable string key for DP tables (matches Python tuple key intent).
 * @param {GameState} state
 */
export function stateKey(state) {
  return JSON.stringify(state);
}

/**
 * Human-readable state, e.g. ((1,1),(1,1),0)
 * @param {GameState} state
 */
export function formatState(state) {
  return `((${state[0][0]},${state[0][1]}),(${state[1][0]},${state[1][1]}),${state[2]})`;
}

/**
 * Remaining half-moves until depth (levels left).
 * @param {GameState} state
 * @param {number} depth
 */
export function levelsRemaining(state, depth) {
  return Math.max(0, depth - state[2]);
}
