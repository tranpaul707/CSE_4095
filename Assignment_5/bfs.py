#!/usr/bin/env python3
"""
8-puzzle BFS solver.

Step 1: puzzle state representation and neighbor generation.
Step 2: BFS search with queue, discovered set, parent map, and stats.
Step 3: path reconstruction and solution printing.
"""

from __future__ import annotations

import time
from collections import deque
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
    """Search performance counters for this BFS run."""

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


def bfs(
    start: State, goal: State
) -> tuple[dict[State, State | None] | None, SearchStats]:
    """
    Breadth-first search from start to goal.

    Uses a queue for the frontier. States are added to ``discovered`` when
    first enqueued so they are never re-queued. Parent pointers in
    ``came_from`` support path reconstruction via ``reconstruct_path``.

    Metrics:
      - states_expanded: number of states dequeued / processed
      - states_discovered: number of unique states ever added to discovered
      - time_seconds: wall time for the search only

    Returns ``(came_from, stats)`` if the goal is found, else ``(None, stats)``.
    ``came_from[start]`` is ``None``.
    """
    t0 = time.perf_counter()

    frontier: deque[State] = deque([start])
    discovered: set[State] = {start}
    came_from: dict[State, State | None] = {start: None}
    states_expanded = 0

    while frontier:
        current = frontier.popleft()
        states_expanded += 1

        if current == goal:
            stats = SearchStats(
                states_expanded=states_expanded,
                states_discovered=len(discovered),
                time_seconds=time.perf_counter() - t0,
            )
            return came_from, stats

        for nxt in neighbors(current):
            if nxt in discovered:
                continue
            discovered.add(nxt)
            came_from[nxt] = current
            frontier.append(nxt)

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
    # Smoke check for Step 3 — final main() wiring comes next.
    came_from, stats = bfs(START, GOAL)
    if came_from is None:
        print("Goal not reached (unsolvable or search exhausted).")
        print(f"States expanded: {stats.states_expanded}")
        print(f"States discovered: {stats.states_discovered}")
        print(f"Time taken: {stats.time_seconds:.4f} seconds")
    else:
        path = reconstruct_path(came_from, GOAL)
        print_solution(path, stats)
