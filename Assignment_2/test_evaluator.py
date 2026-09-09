"""
Test suite for the two-stack expression evaluator.
Run: python3 test_evaluator.py
"""

from evaluator import ExpressionError, evaluate_expression


def expect(expr: str, value: float, tol: float = 1e-9) -> None:
    got = evaluate_expression(expr)
    if abs(got - value) > tol:
        raise AssertionError(f"{expr!r}: expected {value}, got {got}")
    print(f"  PASS  {expr!r:25} -> {got}")


def expect_error(expr: str) -> None:
    try:
        got = evaluate_expression(expr)
    except ExpressionError as exc:
        print(f"  PASS  {expr!r:25} -> Error: {exc}")
        return
    raise AssertionError(f"{expr!r}: expected error, got {got}")


def main() -> None:
    print("Basic arithmetic")
    expect("2 + 3", 5)
    expect("10 - 4", 6)
    expect("3 * 4", 12)
    expect("20 / 5", 4)

    print("Precedence")
    expect("2 + 3 * 4", 14)
    expect("10 - 2 * 3", 4)
    expect("20 / 5 + 2", 6)

    print("Parentheses")
    expect("(2 + 3) * 4", 20)
    expect("10 / (2 + 3)", 2)
    expect("((2 + 3) * 4)", 20)

    print("Left-to-right")
    expect("10 - 3 - 2", 5)
    expect("20 / 5 * 2", 8)

    print("Unary operators")
    expect("-5", -5)
    expect("+5", 5)
    expect("-5 + 3", -2)
    expect("5 * -2", -10)
    expect("-(3 + 4)", -7)
    expect("2 + -3", -1)
    expect("2 + -3 * 4", -10)
    expect("--5", 5)
    expect("2 * --3", 6)
    expect("-(-3)", 3)

    print("Decimals")
    expect("3.5 + 2.5", 6.0)
    expect("2.5 * 4", 10.0)
    expect("10.0 / 4", 2.5)
    expect("3.14 * 2", 6.28)
    expect("-2.5 + 10", 7.5)

    print("More examples from the brief")
    expect("2 + 3", 5)
    expect("10 - 4", 6)
    expect("2 * 5", 10)
    expect("10 / 2", 5)
    expect("(2 + 3) * 4", 20)
    expect("10 / (2 + 3)", 2)
    expect("-5 + 3", -2)
    expect("5 * -2", -10)
    expect("+5", 5)

    print("Error cases")
    expect_error("10 / 0")
    expect_error("(2 + 3")
    expect_error("2 + 3)")
    expect_error("2 +")
    expect_error("*")
    expect_error("abc")
    expect_error("")
    expect_error("   ")
    expect_error("2..5")
    expect_error("()")

    print("\nAll tests passed.")


if __name__ == "__main__":
    main()
