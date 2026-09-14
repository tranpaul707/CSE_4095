#!/usr/bin/env python3
"""
Card 24 — command-line game and reference solver.

Deal four cards from a standard 52-card deck. Use each card's value exactly
once with +, -, *, / and parentheses to make exactly 24.

Commands while playing:
  <expression>  check your answer
  solve         reveal one solution from the exhaustive solver
  new           deal a new solvable hand
  quit / exit   leave the game
"""

from __future__ import annotations

import random
import re
import sys
from collections import Counter
from dataclasses import dataclass
from fractions import Fraction
from typing import Iterable

# ---------------------------------------------------------------------------
# Cards and deck
# ---------------------------------------------------------------------------

SUITS = ("♠", "♥", "♦", "♣")
RANKS = ("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K")

RANK_VALUES: dict[str, int] = {
    "A": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
}

TARGET = Fraction(24)


@dataclass(frozen=True)
class Card:
    """One physical playing card (rank + suit)."""

    rank: str
    suit: str

    @property
    def value(self) -> int:
        return RANK_VALUES[self.rank]

    def display(self) -> str:
        return f"{self.suit} {self.rank}"


def make_deck() -> list[Card]:
    """Return a full 52-card deck."""
    return [Card(rank, suit) for suit in SUITS for rank in RANKS]


def deal_four(deck: list[Card] | None = None, rng: random.Random | None = None) -> list[Card]:
    """Draw four unique physical cards without replacement."""
    rng = rng or random.Random()
    source = list(deck) if deck is not None else make_deck()
    return rng.sample(source, 4)


def card_values(cards: Iterable[Card]) -> list[int]:
    return [c.value for c in cards]


# ---------------------------------------------------------------------------
# Binary-expression-tree solver (exact Fraction arithmetic)
# ---------------------------------------------------------------------------

OPS = ("+", "-", "*", "/")


def _combine(a: Fraction, b: Fraction, op: str) -> Fraction | None:
    """Apply a binary op; return None for illegal division by zero."""
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        if b == 0:
            return None
        return a / b
    raise ValueError(f"Unknown operator: {op}")


def _format_expr(left: str, op: str, right: str) -> str:
    """Parenthesize a binary combination for unambiguous display."""
    return f"({left} {op} {right})"


def find_solution(values: list[int]) -> str | None:
    """
    Exhaustive search over binary expression trees.

    For every ordered pair of current sub-results, try +, -, *, /, then
    recurse on the remaining values plus the combined result. Ordered pairs
    cover non-commutative operand orders. Returns one expression string that
    evaluates to exactly 24, or None if unsolvable.
    """
    if len(values) != 4:
        raise ValueError("find_solution expects exactly four values")

    nodes: list[tuple[Fraction, str]] = [
        (Fraction(v), str(v)) for v in values
    ]
    # Memoize multisets of Fraction values already explored (preserve duplicates).
    seen: set[tuple[tuple[int, int], ...]] = set()

    def key_of(items: list[tuple[Fraction, str]]) -> tuple[tuple[int, int], ...]:
        return tuple(sorted((f.numerator, f.denominator) for f, _ in items))

    def search(items: list[tuple[Fraction, str]]) -> str | None:
        if len(items) == 1:
            value, expr = items[0]
            if value == TARGET:
                # Strip a single outer pair of parentheses for nicer display.
                if expr.startswith("(") and expr.endswith(")"):
                    return expr[1:-1]
                return expr
            return None

        k = key_of(items)
        if k in seen:
            return None
        seen.add(k)

        n = len(items)
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                a_val, a_expr = items[i]
                b_val, b_expr = items[j]
                rest = [items[t] for t in range(n) if t != i and t != j]
                for op in OPS:
                    combined = _combine(a_val, b_val, op)
                    if combined is None:
                        continue
                    new_expr = _format_expr(a_expr, op, b_expr)
                    found = search(rest + [(combined, new_expr)])
                    if found is not None:
                        return found
        return None

    return search(nodes)


def has_solution(values: list[int]) -> bool:
    """True if the four values can make exactly 24."""
    return find_solution(values) is not None


def deal_solvable_hand(rng: random.Random | None = None) -> tuple[list[Card], str]:
    """
    Keep dealing four-card hands until one is solvable.
    Returns (cards, one_solution_expression). Unsolvable hands are discarded
    silently — the player never sees them.
    """
    rng = rng or random.Random()
    while True:
        cards = deal_four(rng=rng)
        solution = find_solution(card_values(cards))
        if solution is not None:
            return cards, solution


# ---------------------------------------------------------------------------
# Safe expression validation and evaluation
# ---------------------------------------------------------------------------

# Allowed characters after stripping whitespace for structure checks.
_ALLOWED_CHARS = set("0123456789+-*/()")

# Token pattern: integers or operators / parentheses.
_TOKEN_RE = re.compile(r"\d+|[+\-*/()]")


class ExpressionError(Exception):
    """Raised when a player expression is invalid."""


def _tokenize(expression: str) -> list[str]:
    text = expression.strip()
    if not text:
        raise ExpressionError("Empty expression.")

    # Reject anything outside the whitelist (letters, underscores, dots, …).
    compact = text.replace(" ", "")
    if any(ch not in _ALLOWED_CHARS for ch in compact):
        raise ExpressionError(
            "Invalid characters. Use only numbers, +, -, *, /, parentheses, and spaces."
        )

    tokens = _TOKEN_RE.findall(compact)
    if "".join(tokens) != compact:
        raise ExpressionError("Could not parse expression.")
    return tokens


def _extract_numbers(tokens: list[str]) -> list[int]:
    return [int(t) for t in tokens if t.isdigit()]


def _check_multiset(numbers: list[int], card_vals: list[int]) -> None:
    if Counter(numbers) != Counter(card_vals):
        raise ExpressionError(
            "You must use all four card values exactly once "
            f"(cards are {sorted(card_vals)})."
        )


def _check_structure(tokens: list[str]) -> None:
    """Reject obvious malformed operator / parenthesis patterns."""
    if not tokens:
        raise ExpressionError("Empty expression.")

    depth = 0
    prev: str | None = None
    for tok in tokens:
        if tok == "(":
            depth += 1
            if prev is not None and (prev.isdigit() or prev == ")"):
                raise ExpressionError("Implicit multiplication is not allowed.")
        elif tok == ")":
            depth -= 1
            if depth < 0:
                raise ExpressionError("Unbalanced parentheses.")
            if prev == "(":
                raise ExpressionError("Empty parentheses.")
            if prev in OPS:
                raise ExpressionError("Operator before closing parenthesis.")
        elif tok in OPS:
            if prev is None or prev in OPS or prev == "(":
                # Unary +/- is not part of Card 24; reject leading ops.
                raise ExpressionError("Unexpected operator.")
        elif tok.isdigit():
            if prev is not None and (prev.isdigit() or prev == ")"):
                raise ExpressionError("Missing operator between values.")
        prev = tok

    if depth != 0:
        raise ExpressionError("Unbalanced parentheses.")
    if prev in OPS:
        raise ExpressionError("Expression ends with an operator.")


def _parse_fraction(tokens: list[str]) -> Fraction:
    """
    Recursive-descent parser for + - * / with parentheses → Fraction.

    Grammar:
      expr   := term (("+" | "-") term)*
      term   := factor (("*" | "/") factor)*
      factor := NUMBER | "(" expr ")"
    """
    pos = 0

    def peek() -> str | None:
        return tokens[pos] if pos < len(tokens) else None

    def consume(expected: str | None = None) -> str:
        nonlocal pos
        if pos >= len(tokens):
            raise ExpressionError("Unexpected end of expression.")
        tok = tokens[pos]
        if expected is not None and tok != expected:
            raise ExpressionError(f"Expected {expected!r}.")
        pos += 1
        return tok

    def parse_expr() -> Fraction:
        value = parse_term()
        while peek() in ("+", "-"):
            op = consume()
            rhs = parse_term()
            value = value + rhs if op == "+" else value - rhs
        return value

    def parse_term() -> Fraction:
        value = parse_factor()
        while peek() in ("*", "/"):
            op = consume()
            rhs = parse_factor()
            if op == "*":
                value = value * rhs
            else:
                if rhs == 0:
                    raise ExpressionError("Division by zero.")
                value = value / rhs
        return value

    def parse_factor() -> Fraction:
        tok = peek()
        if tok is None:
            raise ExpressionError("Unexpected end of expression.")
        if tok == "(":
            consume("(")
            value = parse_expr()
            consume(")")
            return value
        if tok.isdigit():
            consume()
            return Fraction(int(tok))
        raise ExpressionError(f"Unexpected token {tok!r}.")

    result = parse_expr()
    if pos != len(tokens):
        raise ExpressionError("Unexpected trailing tokens.")
    return result


def validate_and_evaluate(expression: str, card_vals: list[int]) -> Fraction:
    """
    Validate that expression uses the four card values exactly once with only
    allowed operators, then evaluate to an exact Fraction.
    """
    tokens = _tokenize(expression)
    _check_structure(tokens)
    numbers = _extract_numbers(tokens)
    _check_multiset(numbers, card_vals)
    return _parse_fraction(tokens)


def solution_uses_cards(expression: str, card_vals: list[int]) -> bool:
    """True if a solver expression uses exactly the given multiset of values."""
    try:
        tokens = _tokenize(expression)
        return Counter(_extract_numbers(tokens)) == Counter(card_vals)
    except ExpressionError:
        return False


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def format_hand(cards: list[Card]) -> str:
    return "    ".join(c.display() for c in cards)


def play(rng: random.Random | None = None) -> None:
    """Interactive Card 24 game loop."""
    rng = rng or random.Random()
    print("Welcome to Card 24!")
    print("Make 24 using all four cards exactly once with +, -, *, / and ().")
    print("Commands: solve  |  new  |  quit")
    print()

    cards: list[Card]
    solution: str
    solved = False

    def new_round() -> None:
        nonlocal cards, solution, solved
        cards, solution = deal_solvable_hand(rng=rng)
        solved = False
        print("Your cards:")
        print(format_hand(cards))
        print()

    new_round()

    while True:
        if solved:
            prompt = "Round solved. Type new or quit:\n> "
        else:
            prompt = "Enter an expression using all four cards:\n> "

        try:
            line = input(prompt)
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            return

        text = line.strip()
        if not text:
            print("Empty input. Try again.\n")
            continue

        lower = text.lower()
        if lower in ("quit", "exit", "q"):
            print("Goodbye!")
            return

        if lower in ("new", "next"):
            print()
            new_round()
            continue

        if lower in ("solve", "solution", "hint"):
            if solved:
                print(f"Solution was: {solution} = 24\n")
                continue
            print()
            print("Solution")
            print(f"{solution} = 24")
            print("This hand has been solved.")
            print()
            solved = True
            continue

        if solved:
            print("This hand is already solved. Type new or quit.\n")
            continue

        vals = card_values(cards)
        try:
            result = validate_and_evaluate(text, vals)
        except ExpressionError as exc:
            print(f"✗ Invalid Expression")
            print(str(exc))
            print()
            continue

        print(f"Expression value: {result}")
        print()
        if result == TARGET:
            print("✓ Correct! You made 24!")
            print()
            solved = True
        else:
            print("✗ Incorrect. The expression does not equal 24.")
            print()


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if argv and argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        return 0
    play()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
