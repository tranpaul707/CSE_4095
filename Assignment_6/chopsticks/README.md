# Reflection

Q: Why does Player A maximize while Player B minimizes?

A: Player A maximizes to help secure an outcome where A wins, Player B minimizes so that A doesn't win, preferrably toward an outcome where B wins. It operates on a (-1 to +1) scale to determines whoever wins a game

Q: Why is the DP table built from the deepest level toward level 0?

A: It is built this way because working backwards from known outcomes make it easier to determine the best outcomes earlier in the game. This is particularly helpful the AI opponent

Q: Why can dynamic programming be substantially faster than recursively exploring the complete game tree?

A: Because dyanmic programming like caching branching trees can help avoid solving the same branch we solved before over and over again. Whereas solving recursively would be computationally expensive

Q: What part of the project did your AI assistant help the most?

A: It definitely did the best with coding out the game logic, UI design took some time and effort because it's personal creative process

Q: What AI generated suggestion did you have to verify, modify, or reject?

A: The one suggestion that I had to verify the most was UI design, expecially regarding hand orientation.

# Chopsticks

Browser Chopsticks game with an optimal computer opponent driven by dynamic programming / minimax. Rules and values match the Python reference in `../chopsticks.py`.

## How to run

Everything runs locally on your own machine — no account, hosting, or setup beyond the steps below.

**Requirements:** `git`, Python 3 (already on macOS/Linux), and any modern browser. There is nothing to install and no build step — the site is plain HTML/CSS/JS.

1. Clone the repository and enter it:

   ```bash
   git clone https://github.com/tranpaul707/CSE_4095.git
   cd CSE_4095
   ```

   (If you already have the repo, just open a terminal at the **repository root** — the folder that contains `Assignment_6/`.)

2. Start a local web server from the `chopsticks` folder:

   ```bash
   cd Assignment_6/chopsticks
   python3 -m http.server 8000
   ```

   On Windows, use `python` instead of `python3`.

3. Open **http://localhost:8000** in your browser. You should see the **"Who goes first?"** screen.
4. When you're done, stop the server with **Ctrl+C** in that terminal.

If port 8000 is already in use, pick another one (e.g. `python3 -m http.server 8080`) and open `http://localhost:8080` instead.

Why a server? The app loads `game.js` and `ai.js` as ES modules, and browsers block module scripts when a page is opened directly from `file://`. If you double-click `index.html` instead, the setup screen appears but the buttons do nothing.

### Optional: Python CLI reference

The original terminal version lives one folder up. From the repository root:

```bash
cd Assignment_6
python3 chopsticks.py
```

## Files

| File | Responsibility |
| --- | --- |
| `index.html` | Page structure, controls, human interaction, AI Analysis panel |
| `style.css` | Layout, fist-hand visuals, animations, reduced-motion |
| `game.js` | **Only** place for Chopsticks rules: state, overflow, legal moves, terminals |
| `ai.js` | DP table, minimax values, computer move selection, analysis payload |
| `README.md` | This document |
| `VIBE_LOG.md` | AI-assisted development log |

`game.js` is the single source of truth for legality. Both the UI and `ai.js` call `nextMoves` / classifiers from there — rules are not duplicated in HTML or the AI.

## How to play

1. Pick your seat on the **Who goes first?** screen. **Player A** always opens
   (level 0 is A's turn in `game.js`), so *Play as Player A* = you move first and
   *Play as Player B* = the computer opens and you move second.
2. Tap one of your live hands. It gets a gold ring and every legal target lights up:
   - **Green ring** on an opponent hand → attack it.
   - **Dashed blue ring** on your other hand (plus a → arrow) → move fingers to it.
3. Tap a target. Attacks slide your hand into the opponent's; redistributions fly
   finger tokens from one hand to the other. If more than one amount is legal
   (e.g. move 1 or 2), small `+1` / `+2` chips appear under your hands — pick one.
4. Tap the selected hand again to deselect it.
5. **AI Analysis** shows/hides the minimax values from the computer's last turn.
   **Restart** returns to role selection.

Every highlighted target comes straight from `legalAttacks` / `legalRedistributions`
in `game.js`; the UI never decides legality itself (so overflow, same-hand moves,
and pure left↔right swaps are simply never offered).

## State representation

```text
((A_left, A_right), (B_left, B_right), level)
```

Initial state: `((1,1),(1,1),0)`.

- Even `level` → Player A’s turn (MAX)
- Odd `level` → Player B’s turn (MIN)
- Default horizon: **10 moves** ⇒ DP `depth = 20` (same as the Python CLI)

## Game rules (engine)

### Overflow

`overflowSum(a, b)`: if `a + b >= 5`, the hand becomes `0`; otherwise return `a + b`.

### Legal moves

`nextMoves(state)` returns every legal successor:

1. **Attack** — add one of your live hands to one of the opponent’s live hands (via overflow).
2. **Redistribute** — move fingers between your own hands without reaching 5+, and without a pure left/right swap.

If either player is `(0,0)`, there are no moves (game over).

### Terminal states

From Player A’s perspective:

| Situation | Result | Value |
| --- | --- | --- |
| B is `(0,0)` | A wins | `+1` |
| A is `(0,0)` | B wins | `-1` |
| Both alive at `depth` | Tie | `0` |

## Minimax / dynamic programming

`buildDpTable(depth)` fills a table bottom-up from `level = depth` down to `0`:

- Store `(value, bestMove)` for each state.
- A’s turn → choose the successor with **maximum** value.
- B’s turn → choose the successor with **minimum** value.
- Values are always from **A’s** perspective.

The computer never picks randomly; it reads the precomputed best move.

## Architecture

```text
game.js  →  legal moves
              ├── index.html (human UI)
              └── ai.js (optimal play + analysis)
```

## Python → JavaScript

| Python | JavaScript |
| --- | --- |
| `overflow_sum` | `overflowSum` |
| `next_moves` | `nextMoves` |
| `best_move_dp` | `buildDpTable` |
| CLI game loop | `index.html` module script |

Opening position at depth 20 evaluates to **0 (tie)** with optimal play.

## Testing approach

Verified during development (see `VIBE_LOG.md`):

- Overflow and `nextMoves` fixtures matched Python for several states.
- DP base cases, MAX/MIN choice, and opening value (`0`) matched Python.
- Forced-win state `((4,4),(1,0),0)` → `+1`.
- Browser checks for attacks, hand-to-hand redistribution (single and multi-amount), both roles, AI Analysis, restart.

## AI-assisted development

Planned and implemented with Cursor assistance, then reviewed against the Python reference. Details are in [`VIBE_LOG.md`](VIBE_LOG.md).
