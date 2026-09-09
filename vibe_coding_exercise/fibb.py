#!/usr/bin/env python3
"""
Extract leading digits of the first n Fibonacci numbers via Binet's
formula and compare observed frequencies with Benford's Law.

Binet:  F_k ≈ φ^k / √5
So:     log10(F_k) ≈ k·log10(φ) − log10(√5)

The integer part of that log is discarded; the fractional part
(mantissa) yields the leading digit without building F_k itself,
so very large n stays fast and memory-light.
"""

from __future__ import annotations

import math
import sys
from collections import Counter

PHI = (1 + math.sqrt(5)) / 2
LOG10_PHI = math.log10(PHI)
LOG10_SQRT5 = 0.5 * math.log10(5)


def benford_percentages() -> dict[int, float]:
    """Theoretical Benford first-digit percentages for digits 1–9."""
    return {d: 100.0 * math.log10(1 + 1 / d) for d in range(1, 10)}


# Binet log leading digits match exact F_k for all k >= this index.
_BINET_SAFE_K = 6

# Exact F_0 .. F_5 for the few cases where the raw Binet float
# is still close enough to a digit boundary to mis-order the lead digit.
_SMALL_FIB = [0, 1, 1, 2, 3, 5]


def fib_first_digit_binet(k: int) -> int | None:
    """
    Leading digit of F_k using Binet's approximation.

    F_0 = 0 → no leading digit.
    F_k = round(φ^k / √5) for k ≥ 1.

    For tiny k the float approximation can sit on the wrong side of a
    leading-digit boundary, so those values use the exact sequence.
    """
    if k <= 0:
        return None

    if k < _BINET_SAFE_K:
        return int(str(_SMALL_FIB[k])[0])

    # log10(F_k) ≈ k·log10(φ) − log10(√5)
    log10_f = k * LOG10_PHI - LOG10_SQRT5
    mantissa = log10_f - math.floor(log10_f)
    leading = 10**mantissa

    # Guard floating-point edge cases near powers of ten.
    digit = int(leading)
    if digit < 1:
        return 1
    if digit > 9:
        return 9
    return digit


def first_digits_binet(n: int) -> list[int]:
    """
    Leading digits for the first n Fibonacci terms F_0 … F_{n-1}.
    Skips non-positive terms (only F_0).
    """
    digits: list[int] = []
    for k in range(n):
        d = fib_first_digit_binet(k)
        if d is not None:
            digits.append(d)
    return digits


def analyze(n: int) -> None:
    digits = first_digits_binet(n)

    if not digits:
        print("No positive Fibonacci terms to analyze.")
        return

    counts = Counter(digits)
    total = len(digits)
    expected = benford_percentages()

    print(f"Fibonacci terms considered: {n}  (F_0 … F_{n - 1})")
    print("Method:                     Binet (log₁₀ mantissa)")
    print(f"Positive terms analyzed:    {total}")
    print()
    print(f"{'Digit':>5}  {'Count':>8}  {'Observed %':>12}  {'Benford %':>12}  {'Diff':>10}")
    print("-" * 55)

    for d in range(1, 10):
        count = counts.get(d, 0)
        observed = 100.0 * count / total
        benford = expected[d]
        diff = observed - benford
        print(
            f"{d:>5}  {count:>8}  {observed:>11.2f}%  {benford:>11.2f}%  {diff:>+9.2f}"
        )

    print("-" * 55)
    print(f"{'Total':>5}  {total:>8}  {100.0:>11.2f}%")


def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: python3 {sys.argv[0]} <n>", file=sys.stderr)
        print("  n = number of Fibonacci terms (F_0 … F_{n-1})", file=sys.stderr)
        sys.exit(1)

    try:
        n = int(sys.argv[1])
    except ValueError:
        print("Error: n must be an integer.", file=sys.stderr)
        sys.exit(1)

    if n < 1:
        print("Error: n must be a positive integer.", file=sys.stderr)
        sys.exit(1)

    analyze(n)


if __name__ == "__main__":
    main()
