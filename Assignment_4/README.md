# Card 24

Make **24** from four randomly dealt playing cards using `+`, `-`, `*`, `/`, and parentheses. Each card value must be used exactly once.

Two independent implementations (same rules and solver approach):

| File | Role |
| --- | --- |
| `card24.py` | Python CLI + reference solver |
| `card24.html` | Self-contained browser game (no server) |
| `test_card24.py` | Unit tests for the Python implementation |

## Python CLI

```bash
python3 card24.py
```

While playing:

- type an expression and press Enter
- `solve` — reveal one solution
- `new` — deal a new solvable hand
- `quit` — exit

Run tests:

```bash
python3 test_card24.py
```

## Browser

Open `card24.html` in a browser (double-click or File → Open). No install, server, or internet required.

Controls: **Check Expression**, **Show Solution**, **New Cards**.

## Card values

`A=1`, `2`–`10` face value, `J=11`, `Q=12`, `K=13`. Suits are display-only.
