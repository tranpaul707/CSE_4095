#!/usr/bin/env python3
"""
Compare BFS and A* on the same 8-puzzle starting state.

Runs both solvers from bfs.py and astar.py on the default START state
and prints a side-by-side measurement table.

Usage:
    python3 compare_search.py
"""

from __future__ import annotations

import argparse
import sys

from astar import (
    GOAL,
    START,
    astar,
    reconstruct_path as astar_reconstruct,
)
from bfs import (
    bfs,
    reconstruct_path as bfs_reconstruct,
)


def run_both(start=START, goal=GOAL):
    """Execute BFS and A* on the same puzzle; return result dicts."""
    bfs_came, bfs_stats = bfs(start, goal)
    astar_came, astar_stats = astar(start, goal)

    bfs_result = {
        "ok": bfs_came is not None,
        "moves": None,
        "expanded": bfs_stats.states_expanded,
        "discovered": bfs_stats.states_discovered,
        "time": bfs_stats.time_seconds,
    }
    if bfs_came is not None:
        bfs_path = bfs_reconstruct(bfs_came, goal)
        bfs_result["moves"] = len(bfs_path) - 1
        bfs_result["path"] = bfs_path

    astar_result = {
        "ok": astar_came is not None,
        "moves": None,
        "expanded": astar_stats.states_expanded,
        "discovered": astar_stats.states_discovered,
        "time": astar_stats.time_seconds,
    }
    if astar_came is not None:
        astar_path = astar_reconstruct(astar_came, goal)
        astar_result["moves"] = len(astar_path) - 1
        astar_result["path"] = astar_path

    return bfs_result, astar_result


def _fmt(value) -> str:
    if value is None:
        return "—"
    if isinstance(value, float):
        return f"{value:.4f}s"
    return f"{value:,}" if isinstance(value, int) else str(value)


def print_comparison(bfs_result: dict, astar_result: dict) -> None:
    """Print a Measurement / BFS / A* table."""
    rows = [
        ("Optimal moves", bfs_result["moves"], astar_result["moves"]),
        ("States expanded", bfs_result["expanded"], astar_result["expanded"]),
        (
            "States discovered/generated",
            bfs_result["discovered"],
            astar_result["discovered"],
        ),
        ("Time taken", bfs_result["time"], astar_result["time"]),
    ]

    col_m = max(len("Measurement"), *(len(r[0]) for r in rows))
    col_b = max(len("BFS"), *(len(_fmt(r[1])) for r in rows))
    col_a = max(len("A*"), *(len(_fmt(r[2])) for r in rows))

    def line(m: str, b: str, a: str) -> str:
        return f"{m:<{col_m}}  {b:>{col_b}}  {a:>{col_a}}"

    sep = "-" * (col_m + col_b + col_a + 4)

    print()
    print(line("Measurement", "BFS", "A*"))
    print(sep)
    for name, b, a in rows:
        print(line(name, _fmt(b), _fmt(a)))
    print(sep)

    if bfs_result["ok"] and astar_result["ok"]:
        if bfs_result["moves"] == astar_result["moves"]:
            print(
                f"Both found the same optimal length: {bfs_result['moves']} moves."
            )
        else:
            print(
                "WARNING: move counts differ "
                f"(BFS={bfs_result['moves']}, A*={astar_result['moves']})."
            )
        ratio = (
            bfs_result["expanded"] / astar_result["expanded"]
            if astar_result["expanded"]
            else float("inf")
        )
        print(
            f"A* expanded {astar_result['expanded']:,} states vs "
            f"BFS {bfs_result['expanded']:,} "
            f"({ratio:.1f}× fewer expansions for A*)."
        )
    elif not bfs_result["ok"] and not astar_result["ok"]:
        print("Both solvers report no solution (unsolvable or exhausted).")
    else:
        print("WARNING: one solver found a solution and the other did not.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Compare BFS vs A* on the default 8-puzzle START state."
    )
    parser.parse_args(argv)

    print("8-Puzzle search comparison")
    print("Start:", START)
    print("Goal: ", GOAL)

    bfs_result, astar_result = run_both(START, GOAL)
    print_comparison(bfs_result, astar_result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
