# Recursive Checker Visualizer

Interactive React visualizer for the recursive adjacent-swap checker algorithm.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (includes `npm`)

## How to run

From this directory (`CSE_4095/Assignment_1`):

```bash
# 1. Install dependencies (first time, or after package changes)
npm install

# 2. Start the development server
npm run dev
```

Vite will print a local URL in the terminal — open it in your browser (typically `http://localhost:5173`).

If that port is already in use, Vite picks the next free one (for example `http://localhost:5174`) and shows it in the same output.

Stop the server with `Ctrl+C`.

### Other commands

| Command | Description |
| --- | --- |
| `npm run build` | Typecheck and build a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run verify` | Run acceptance checks for `n = 1, 2, 3, 5` |

## What it does

Transforms `[0]*n + [1]*n` into `[0, 1, 0, 1, …, 0, 1]` using **only adjacent swaps**, driven by:

```python
def alternate_checkers(checkers, n, i=0):
    if i >= 2 * n - 1:
        return
    if checkers[i] == 0 and checkers[i + 1] == 0:
        # find next black, bubble left with adjacent swaps
        ...
    alternate_checkers(checkers, n, i + 2)
```

## Controls

| Button | Behavior |
| --- | --- |
| **Generate Board** | Build a fresh solution for `n` (max 20) and reset history |
| **Start** | Animate from the initial board into swap #1 |
| **Previous / Next** | Step one adjacent swap backward / forward |
| **Play / Pause** | Auto-run or stop playback |
| **Reset** | Restore the initial board for the current `n` |

## Complexity

Total adjacent swaps: `n(n − 1) / 2`
