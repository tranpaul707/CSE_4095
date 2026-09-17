The reason A* expanded fewer states than BFS is because BFS searches based on how far a states is from the start. While A* considers how far it appears to be from the goal. BFS by default explores a huge number of states at every depth, which may not be towards a helpful direction. The heuristic that A* uses uses a heuristic, and actively searches for the path that is more likely to be closer to the goal state.

## How to run

From this directory (`CSE_4095/Assignment_5`):

### Python solvers

```bash
python3 bfs.py
python3 astar.py
```

### Compare BFS vs A*

Prints a side-by-side table (optimal moves, states expanded, states discovered, time):

```bash
python3 compare_search.py
```

### Browser visualizers

Open in a browser (double-click or File → Open). No server required.

- `bfs.html` — step through the BFS solution path
- `astar.html` — step through A* search decisions (`f(n) = g(n) + h(n)`) and the optimal path

### Files

| File | Role |
| --- | --- |
| `bfs.py` | BFS CLI solver |
| `astar.py` | A* CLI solver (Manhattan heuristic) |
| `compare_search.py` | Runs both and prints the comparison table |
| `bfs.html` | BFS path visualizer |
| `astar.html` | A* search visualizer |
