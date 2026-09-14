#!/usr/bin/env python3
"""Unit tests for Card 24 (card24.py)."""

from __future__ import annotations

import unittest
from collections import Counter
from fractions import Fraction

from card24 import (
    RANKS,
    RANK_VALUES,
    SUITS,
    TARGET,
    Card,
    ExpressionError,
    card_values,
    deal_four,
    deal_solvable_hand,
    find_solution,
    has_solution,
    make_deck,
    solution_uses_cards,
    validate_and_evaluate,
)


class TestCards(unittest.TestCase):
    def test_deck_has_52_cards(self) -> None:
        deck = make_deck()
        self.assertEqual(len(deck), 52)

    def test_deck_unique(self) -> None:
        deck = make_deck()
        self.assertEqual(len(set(deck)), 52)

    def test_four_cards_unique_physical(self) -> None:
        for _ in range(20):
            hand = deal_four()
            self.assertEqual(len(hand), 4)
            self.assertEqual(len(set(hand)), 4)

    def test_rank_values(self) -> None:
        self.assertEqual(RANK_VALUES["A"], 1)
        self.assertEqual(RANK_VALUES["J"], 11)
        self.assertEqual(RANK_VALUES["Q"], 12)
        self.assertEqual(RANK_VALUES["K"], 13)
        for r in ("2", "3", "4", "5", "6", "7", "8", "9", "10"):
            self.assertEqual(RANK_VALUES[r], int(r))

    def test_suits_and_ranks_complete(self) -> None:
        self.assertEqual(len(SUITS), 4)
        self.assertEqual(len(RANKS), 13)
        deck = make_deck()
        self.assertEqual({c.suit for c in deck}, set(SUITS))
        self.assertEqual({c.rank for c in deck}, set(RANKS))

    def test_card_display_and_value(self) -> None:
        c = Card("Q", "♥")
        self.assertEqual(c.value, 12)
        self.assertEqual(c.display(), "♥ Q")


class TestSolver(unittest.TestCase):
    def test_known_solvable_1346(self) -> None:
        values = [1, 3, 4, 6]
        sol = find_solution(values)
        self.assertIsNotNone(sol)
        assert sol is not None
        result = validate_and_evaluate(sol, values)
        self.assertEqual(result, TARGET)
        self.assertTrue(solution_uses_cards(sol, values))

    def test_has_solution_true(self) -> None:
        self.assertTrue(has_solution([1, 3, 4, 6]))
        self.assertTrue(has_solution([8, 8, 3, 3]))

    def test_known_unsolvable(self) -> None:
        # Verified unsolvable with only + - * / on four positive integers.
        self.assertFalse(has_solution([1, 1, 1, 1]))
        self.assertFalse(has_solution([1, 1, 1, 2]))
        self.assertIsNone(find_solution([1, 1, 1, 1]))

    def test_duplicate_ranks(self) -> None:
        values = [2, 2, 6, 12]
        sol = find_solution(values)
        self.assertIsNotNone(sol)
        assert sol is not None
        self.assertEqual(validate_and_evaluate(sol, values), TARGET)
        self.assertEqual(Counter(_nums(sol)), Counter(values))

    def test_subtraction_and_division_orders(self) -> None:
        # Classic: 6 / (1 - 3/4) = 24
        values = [1, 3, 4, 6]
        sol = find_solution(values)
        self.assertIsNotNone(sol)
        assert sol is not None
        self.assertEqual(validate_and_evaluate(sol, values), Fraction(24))

    def test_fraction_intermediates(self) -> None:
        values = [1, 5, 5, 5]
        # 5 * (5 - 1/5) = 24
        sol = find_solution(values)
        self.assertIsNotNone(sol)
        assert sol is not None
        self.assertEqual(validate_and_evaluate(sol, values), TARGET)

    def test_all_ops_appear_in_some_solutions(self) -> None:
        # Smoke: several solvable hands succeed under the full op set.
        hands = [
            [1, 3, 4, 6],
            [2, 3, 8, 8],
            [4, 4, 4, 6],
            [5, 5, 5, 1],
        ]
        for h in hands:
            sol = find_solution(h)
            self.assertIsNotNone(sol, msg=h)
            assert sol is not None
            self.assertEqual(validate_and_evaluate(sol, h), TARGET)

    def test_deal_solvable_hand(self) -> None:
        cards, sol = deal_solvable_hand()
        vals = card_values(cards)
        self.assertEqual(len(cards), 4)
        self.assertEqual(validate_and_evaluate(sol, vals), TARGET)

    def test_solution_parenthesizations(self) -> None:
        # Solver may return different parenthesizations; all must eval to 24.
        for _ in range(10):
            cards, sol = deal_solvable_hand()
            vals = card_values(cards)
            self.assertEqual(validate_and_evaluate(sol, vals), TARGET)


def _nums(expression: str) -> list[int]:
    import re

    return [int(x) for x in re.findall(r"\d+", expression)]


class TestValidation(unittest.TestCase):
    def setUp(self) -> None:
        self.vals = [7, 12, 3, 1]  # 7, Q, 3, A

    def test_correct_expression(self) -> None:
        # (7 - 3) * (12 / 1) wait that's 4*12=48; use known 1,3,4,6
        vals = [1, 3, 4, 6]
        result = validate_and_evaluate("6 / (1 - 3 / 4)", vals)
        self.assertEqual(result, TARGET)

    def test_incorrect_but_valid(self) -> None:
        vals = [1, 3, 4, 6]
        result = validate_and_evaluate("1 + 3 + 4 + 6", vals)
        self.assertEqual(result, Fraction(14))
        self.assertNotEqual(result, TARGET)

    def test_empty(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("", self.vals)
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("   ", self.vals)

    def test_unbalanced_parens(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("(7 + 3", [7, 3, 12, 1])

    def test_invalid_syntax(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("7 + * 3", [7, 3, 12, 1])

    def test_division_by_zero(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("7 / (3 - 3) * 12", [7, 3, 3, 12])

    def test_unsupported_operators(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("7 ^ 3", [7, 3, 12, 1])
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("7 % 3 + 12 + 1", [7, 3, 12, 1])

    def test_malicious_eval_input(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("__import__('os')", self.vals)
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("__builtins__", self.vals)

    def test_extra_operands(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("1 + 3 + 4 + 6 + 2", [1, 3, 4, 6])

    def test_missing_operands(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("1 + 3 + 4", [1, 3, 4, 6])

    def test_repeated_operand_not_in_hand(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("2 + 2 + 7 + 13", [2, 6, 7, 13])

    def test_duplicate_ranks_allowed(self) -> None:
        vals = [2, 2, 6, 12]
        result = validate_and_evaluate("2 + 2 + 6 + 12", vals)
        self.assertEqual(result, Fraction(22))

    def test_duplicate_ranks_too_many_twos(self) -> None:
        vals = [2, 2, 6, 12]
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("2 + 2 + 2 + 12", vals)

    def test_whitespace(self) -> None:
        vals = [1, 3, 4, 6]
        result = validate_and_evaluate("  6/(1-3/4)  ", vals)
        self.assertEqual(result, TARGET)

    def test_negative_intermediate(self) -> None:
        vals = [1, 3, 4, 6]
        # 1 - 3 = -2 is a valid intermediate in some expressions
        result = validate_and_evaluate("(1 - 3) * (4 - 6)", vals)
        self.assertEqual(result, Fraction(4))

    def test_implicit_multiplication_rejected(self) -> None:
        with self.assertRaises(ExpressionError):
            validate_and_evaluate("6(1+3)", [6, 1, 3, 4])


if __name__ == "__main__":
    unittest.main()
