#!/usr/bin/env python3
"""
Benford's Law first-digit analysis for mathematical sequences.

Usage:
    python benford.py fibonacci 1000000
    python benford.py power2 1000000
    python benford.py factorial 1000000
    python benford.py power3 1000000          # additional experiment
    python benford.py fibonacci 1000000 --plot

Why logarithms recover leading digits
-------------------------------------
Any positive x can be written in scientific form as
    x = m * 10^k
where k is an integer and 1 <= m < 10.  Taking log10:
    log10(x) = log10(m) + k = f + k
with fractional part f = log10(m) in [0, 1).  Then
    m = 10^f,  leading_digit = floor(10^f).
Only f matters; the integer part k (the order of magnitude) does not.
This avoids constructing enormous integers such as F_1000000 or 2^1000000.

Sequence conventions (argument n means exactly n positive terms)
----------------------------------------------------------------
- fibonacci : F_1 .. F_n  with F_1 = 1, F_2 = 1, F_3 = 2, ...
              (skips F_0 = 0, which has no leading digit 1-9)
- power2    : 2^0 .. 2^{n-1}
- factorial : 1! .. n!
- power3    : 3^0 .. 3^{n-1}  (additional experiment)
"""

from __future__ import annotations

import argparse
import math
import sys
from collections import Counter
from typing import Callable, Iterable

# ---------------------------------------------------------------------------
# Constants for Fibonacci via Binet's formula
# ---------------------------------------------------------------------------
# F_k = (phi^k - psi^k) / sqrt(5),  phi = (1+sqrt(5))/2, psi = (1-sqrt(5))/2.
# |psi| < 1, so for k >= 1 the psi term is smaller than 1/2 and
# F_k = round(phi^k / sqrt(5)).  Taking logs:
#   log10(F_k) ≈ k * log10(phi) - log10(sqrt(5))
# For very small k the float can sit near a digit boundary, so those use
# exact values.  For large k the neglected psi term is negligible for the
# first digit, and double precision still resolves the fractional part of
# the log well enough through at least k = 1_000_000.
PHI = (1.0 + math.sqrt(5.0)) / 2.0
LOG10_PHI = math.log10(PHI)
LOG10_SQRT5 = 0.5 * math.log10(5.0)

# Exact F_1 .. F_5 (index matches Fibonacci index).
_SMALL_FIB: dict[int, int] = {1: 1, 2: 1, 3: 2, 4: 3, 5: 5}
_BINET_SAFE_K = 6

LOG10_2 = math.log10(2.0)
LOG10_3 = math.log10(3.0)


# ---------------------------------------------------------------------------
# Leading digit from a base-10 logarithm
# ---------------------------------------------------------------------------
# Tolerance for 10^f sitting just below an integer (e.g. 7.999999999 ≈ 8)
# because log10(2) and similar constants are irrational and truncated in float.
_SIGNIFICAND_EPS = 1e-10


def leading_digit_from_log10(log10_x: float) -> int:
    """
    Return the leading digit (1-9) of a positive number from its log10.

    Write log10(x) = k + f with integer k and fractional part f in [0, 1).
    Then x = 10^{k+f} = 10^f * 10^k, so the significand is 10^f and
        leading_digit = floor(10^f).

    Floating-point note
    -------------------
    When 10^f is extremely close to an integer from below (classic case:
    2^3 = 8, but 10^{3*log10(2)} may evaluate to 7.999...), floor alone
    would report the wrong digit.  We only snap to the nearby integer when
    the gap is within a tiny epsilon — not a general round().
    Values extremely close to 10 correspond to a carry into the next
    power of ten, so the leading digit is 1.
    """
    fraction = log10_x - math.floor(log10_x)
    # Keep fraction in [0, 1) even if floor left a tiny negative residue.
    if fraction < 0.0:
        fraction += 1.0
    elif fraction >= 1.0:
        fraction -= 1.0

    significand = 10.0**fraction

    # Snap only when virtually on an integer boundary.
    nearest = round(significand)
    if nearest >= 2 and nearest <= 10 and abs(significand - nearest) < _SIGNIFICAND_EPS:
        if nearest == 10:
            return 1
        return nearest

    digit = int(significand)
    if digit < 1:
        return 1
    if digit > 9:
        return 9
    return digit


# ---------------------------------------------------------------------------
# Benford analysis (shared)
# ---------------------------------------------------------------------------
def benford_probability(digit: int) -> float:
    """Theoretical P(d) = log10(1 + 1/d) for digit d in 1..9."""
    return math.log10(1.0 + 1.0 / digit)


def benford_percentages() -> dict[int, float]:
    """Theoretical Benford first-digit percentages for digits 1-9."""
    return {d: 100.0 * benford_probability(d) for d in range(1, 10)}


def count_digits(digits: Iterable[int]) -> Counter[int]:
    """Count occurrences of each leading digit 1-9."""
    return Counter(digits)


def build_report(counts: Counter[int]) -> list[dict[str, float | int]]:
    """
    Build per-digit rows: digit, count, observed %, Benford %, difference.
    """
    total = sum(counts[d] for d in range(1, 10))
    if total == 0:
        raise ValueError("No digits to analyze.")

    expected = benford_percentages()
    rows: list[dict[str, float | int]] = []
    for d in range(1, 10):
        count = counts.get(d, 0)
        observed = 100.0 * count / total
        benford = expected[d]
        rows.append(
            {
                "digit": d,
                "count": count,
                "observed": observed,
                "benford": benford,
                "difference": observed - benford,
            }
        )
    return rows


def print_report(title: str, method: str, n: int, rows: list[dict[str, float | int]]) -> None:
    """Print a readable comparison table."""
    total = sum(int(r["count"]) for r in rows)
    print(title)
    print(f"Method:  {method}")
    print(f"n:       {n}")
    print(f"Terms:   {total}")
    print()
    print(f"{'Digit':>5}  {'Count':>8}  {'Observed':>10}  {'Benford':>10}  {'Difference':>12}")
    print("-" * 55)
    for r in rows:
        print(
            f"{int(r['digit']):>5}  "
            f"{int(r['count']):>8}  "
            f"{r['observed']:9.2f}%  "
            f"{r['benford']:9.2f}%  "
            f"{r['difference']:+11.2f}"
        )
    print("-" * 55)
    print(f"{'Total':>5}  {total:>8}  {100.0:9.2f}%")


# ---------------------------------------------------------------------------
# Sequence-specific leading-digit producers (O(1) extra memory)
# ---------------------------------------------------------------------------
def fibonacci_first_digit(k: int) -> int:
    """Leading digit of F_k (k >= 1) via Binet logarithm, exact for small k."""
    if k < _BINET_SAFE_K:
        return int(str(_SMALL_FIB[k])[0])

    # log10(F_k) ≈ k * log10(phi) - log10(sqrt(5))
    log10_f = k * LOG10_PHI - LOG10_SQRT5
    return leading_digit_from_log10(log10_f)


def fibonacci_digits(n: int) -> Iterable[int]:
    """
    Leading digits of F_1 .. F_n.

    Does not construct Fibonacci integers.  Only the Binet log formula
    (or a tiny exact table for k < 6) is used.
    """
    for k in range(1, n + 1):
        yield fibonacci_first_digit(k)


def power_base_digits(n: int, log10_base: float) -> Iterable[int]:
    """
    Leading digits of base^0 .. base^{n-1} using k * log10(base).

    Never constructs base^k.
    """
    for k in range(n):
        yield leading_digit_from_log10(k * log10_base)


def power2_digits(n: int) -> Iterable[int]:
    """Leading digits of 2^0 .. 2^{n-1}."""
    return power_base_digits(n, LOG10_2)


def power3_digits(n: int) -> Iterable[int]:
    """Leading digits of 3^0 .. 3^{n-1} (additional experiment)."""
    return power_base_digits(n, LOG10_3)


def factorial_digits(n: int) -> Iterable[int]:
    """
    Leading digits of 1! .. n! via incremental log10.

    Because log10(m!) = sum_{k=1..m} log10(k), we accumulate only the
    fractional part of the running sum.  That is enough for the leading
    digit and avoids both storing factorials and letting the full
    logarithm grow into the millions (which would waste float precision).
    """
    frac = 0.0
    for m in range(1, n + 1):
        frac += math.log10(m)
        frac -= math.floor(frac)
        if frac < 0.0:
            frac += 1.0
        yield leading_digit_from_log10(frac)


# ---------------------------------------------------------------------------
# Visualization (optional)
# ---------------------------------------------------------------------------
def plot_report(
    title: str,
    rows: list[dict[str, float | int]],
) -> None:
    """Grouped bar chart of observed vs Benford percentages."""
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print(
            "Error: matplotlib is required for --plot.\n"
            "Install it with:  pip install -r requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    digits = [int(r["digit"]) for r in rows]
    observed = [float(r["observed"]) for r in rows]
    benford = [float(r["benford"]) for r in rows]

    x = list(range(len(digits)))
    width = 0.35

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar([i - width / 2 for i in x], observed, width, label="Observed %")
    ax.bar([i + width / 2 for i in x], benford, width, label="Benford %")
    ax.set_xticks(x)
    ax.set_xticklabels([str(d) for d in digits])
    ax.set_xlabel("Leading digit")
    ax.set_ylabel("Percentage")
    ax.set_title(title)
    ax.legend()
    ax.set_ylim(0, max(max(observed), max(benford)) * 1.15)
    fig.tight_layout()
    plt.show()


# ---------------------------------------------------------------------------
# Dispatch / CLI
# ---------------------------------------------------------------------------
SEQUENCES: dict[str, tuple[str, str, Callable[[int], Iterable[int]]]] = {
    "fibonacci": (
        "Fibonacci: F_1 .. F_n  (F_1=1, F_2=1, ...)",
        "Binet log10 mantissa (no large Fibonacci integers)",
        fibonacci_digits,
    ),
    "power2": (
        "Powers of 2: 2^0 .. 2^{n-1}",
        "k * log10(2) fractional part",
        power2_digits,
    ),
    "factorial": (
        "Factorials: 1! .. n!",
        "incremental sum of log10(k), fractional part only",
        factorial_digits,
    ),
    "power3": (
        "Powers of 3: 3^0 .. 3^{n-1}  (additional experiment)",
        "k * log10(3) fractional part",
        power3_digits,
    ),
}


def positive_int(value: str) -> int:
    """argparse type: require a positive integer."""
    try:
        n = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"n must be an integer, got {value!r}") from exc
    if n < 1:
        raise argparse.ArgumentTypeError(f"n must be a positive integer, got {n}")
    return n


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="benford.py",
        description=(
            "Compare first-digit distributions of mathematical sequences "
            "with Benford's Law using scalable logarithmic methods."
        ),
        epilog=(
            "Examples:\n"
            "  python benford.py fibonacci 1000000\n"
            "  python benford.py power2 1000000\n"
            "  python benford.py factorial 1000000\n"
            "  python benford.py power3 1000000\n"
            "  python benford.py fibonacci 1000000 --plot\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "sequence",
        choices=sorted(SEQUENCES.keys()),
        help="Sequence to analyze",
    )
    parser.add_argument(
        "n",
        type=positive_int,
        help="Number of terms (positive integer)",
    )
    parser.add_argument(
        "--plot",
        action="store_true",
        help="Show a grouped bar chart of observed vs Benford percentages",
    )
    return parser.parse_args(argv)


def run_analysis(sequence: str, n: int, plot: bool = False) -> list[dict[str, float | int]]:
    title, method, digit_fn = SEQUENCES[sequence]
    counts = count_digits(digit_fn(n))
    rows = build_report(counts)
    print_report(title, method, n, rows)
    if plot:
        plot_report(f"{title} (n={n})", rows)
    return rows


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    run_analysis(args.sequence, args.n, plot=args.plot)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        raise SystemExit(130)
