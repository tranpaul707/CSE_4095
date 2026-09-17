#!/usr/bin/env python3
"""
8-puzzle A* solver.

Uses f(n) = g(n) + h(n) with Manhattan distance as h(n).
State representation, neighbors, path reconstruction, and output match bfs.py
so the two solvers can be compared directly.
"""

from __future__ import annotations

import heapq
import time
from dataclasses import dataclass

# Flat 3x3 board; blank tile is 0.
State = tuple[int, ...]

START: State = (8, 7, 6, 5, 4, 3, 2, 1, 0)
GOAL: State = (1, 2, 3, 4, 5, 6, 7, 8, 0)

# Index offsets for moving the blank: up, down, left, right.
_MOVES: tuple[tuple[int, int], ...] = (
    (-1, 0),  # up
    (1, 0),   # down
    (0, -1),  # left
    (0, 1),   # right
)


@dataclass(frozen=True)
class SearchStats:
    """Search performance counters for this A* run."""

    states_expanded: int
    states_discovered: int
    time_seconds: float


def blank_index(state: State) -> int:
    """Return the index of the blank tile (0)."""
    return state.index(0)


def neighbors(state: State) -> list[State]:
    """
    Return all states reachable by sliding one tile into the blank.

    Each neighbor is a new tuple; the input state is never mutated.
    Matches bfs.py neighbor generation.
    """
    zero = blank_index(state)
    row, col = divmod(zero, 3)
    result: list[State] = []

    for d_row, d_col in _MOVES:
        new_row = row + d_row
        new_col = col + d_col
        if not (0 <= new_row < 3 and 0 <= new_col < 3):
            continue
        swap_with = new_row * 3 + new_col
        tiles = list(state)
        tiles[zero], tiles[swap_with] = tiles[swap_with], tiles[zero]
        result.append(tuple(tiles))

    return result


def format_board(state: State) -> str:
    """Format a state as three space-separated rows of digits."""
    rows = []
    for r in range(3):
        row = state[r * 3 : (r + 1) * 3]
        rows.append(" ".join(str(tile) for tile in row))
    return "\n".join(rows)


def _goal_positions(goal: State) -> dict[int, tuple[int, int]]:
    """Map each numbered tile to its (row, col) in the goal (blank omitted)."""
    return {tile: divmod(i, 3) for i, tile in enumerate(goal) if tile != 0}


def manhattan_distance(state: State, goal_pos: dict[int, tuple[int, int]]) -> int:
    """
    Sum of Manhattan distances of every numbered tile to its goal cell.

    The blank (0) is excluded from the heuristic.
    """
    total = 0
    for index, tile in enumerate(state):
        if tile == 0:
            continue
        row, col = divmod(index, 3)
        goal_row, goal_col = goal_pos[tile]
        total += abs(row - goal_row) + abs(col - goal_col)
    return total


def astar(
    start: State, goal: State
) -> tuple[dict[State, State | None] | None, SearchStats]:
    """
    A* search from start to goal using Manhattan distance.

    Priority queue entries are ``(f, tie, g, state)``. Because ``heapq`` has
    no decrease-key, an improved path pushes a new entry and leaves the old
    one in the queue. When a popped entry's ``g`` is worse than the best known
    ``g_score[state]``, it is stale and skipped (not counted as expanded).

    Metrics (same definitions as bfs.py):
      - states_expanded: states popped and processed (not stale)
      - states_discovered: unique states ever seen
      - time_seconds: wall time for the search only

    Returns ``(came_from, stats)`` if the goal is found, else ``(None, stats)``.
    ``came_from[start]`` is ``None``.
    """
    t0 = time.perf_counter()

    goal_pos = _goal_positions(goal)
    # (f, tie-breaker, g, state) — tie-breaker keeps ordering stable.
    tie = 0
    g0 = 0
    f0 = g0 + manhattan_distance(start, goal_pos)
    frontier: list[tuple[int, int, int, State]] = [(f0, tie, g0, start)]

    g_score: dict[State, int] = {start: 0}
    came_from: dict[State, State | None] = {start: None}
    discovered: set[State] = {start}
    states_expanded = 0

    while frontier:
        _f, _tie, g, current = heapq.heappop(frontier)

        # Stale entry from a superseded path — do not expand.
        if g > g_score[current]:
            continue

        states_expanded += 1

        if current == goal:
            stats = SearchStats(
                states_expanded=states_expanded,
                states_discovered=len(discovered),
                time_seconds=time.perf_counter() - t0,
            )
            return came_from, stats

        for nxt in neighbors(current):
            tentative_g = g + 1
            if nxt not in g_score or tentative_g < g_score[nxt]:
                g_score[nxt] = tentative_g
                came_from[nxt] = current
                if nxt not in discovered:
                    discovered.add(nxt)
                tie += 1
                f_nxt = tentative_g + manhattan_distance(nxt, goal_pos)
                heapq.heappush(frontier, (f_nxt, tie, tentative_g, nxt))

    stats = SearchStats(
        states_expanded=states_expanded,
        states_discovered=len(discovered),
        time_seconds=time.perf_counter() - t0,
    )
    return None, stats


def reconstruct_path(
    came_from: dict[State, State | None], goal: State
) -> list[State]:
    """
    Walk parent pointers from ``goal`` back to the start, then reverse.

    The returned path includes the initial state as index 0.
    Number of moves is ``len(path) - 1``.
    """
    path: list[State] = []
    current: State | None = goal
    while current is not None:
        path.append(current)
        current = came_from[current]
    path.reverse()
    return path


def print_solution(path: list[State], stats: SearchStats) -> None:
    """Print every state on the path, then move count and search stats."""
    for step, state in enumerate(path):
        print(f"Step {step}")
        print("**********")
        print(format_board(state))
        print("**********")
        print()

    print(f"Number of moves: {len(path) - 1}")
    print(f"States expanded: {stats.states_expanded}")
    print(f"States discovered: {stats.states_discovered}")
    print(f"Time taken: {stats.time_seconds:.4f} seconds")


if __name__ == "__main__":
    came_from, stats = astar(START, GOAL)
    if came_from is None:
        print("Goal not reached (unsolvable or search exhausted).")
        print(f"States expanded: {stats.states_expanded}")
        print(f"States discovered: {stats.states_discovered}")
        print(f"Time taken: {stats.time_seconds:.4f} seconds")
    else:
        path = reconstruct_path(came_from, GOAL)
        print_solution(path, stats)
