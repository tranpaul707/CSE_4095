"""
Two-stack arithmetic expression evaluator (Dijkstra's shunting-yard style).

Uses:
  - values / numbers stack
  - operators stack

Supports integers, decimals, + - * /, parentheses, and unary +/-.
Does NOT use eval() or any expression-evaluation library.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


class ExpressionError(ValueError):
    """Raised when an expression cannot be evaluated."""


# ---------------------------------------------------------------------------
# Tokenization
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Token:
    type: str  # "number" | "operator" | "paren"
    value: str  # internal value (u+/u- for unary)
    display: str  # how it appears in the expression view


def precedence(op: str) -> int:
    """Operator precedence. Higher number = binds more tightly."""
    if op in ("+", "-"):
        return 1
    if op in ("*", "/"):
        return 2
    # Unary operators are right-associative and bind tighter than * /
    if op in ("u+", "u-"):
        return 3
    return 0


def is_unary(op: str) -> bool:
    return op in ("u+", "u-")


def shown(op: str) -> str:
    if op == "u-":
        return "unary −"
    if op == "u+":
        return "unary +"
    return op


def tokenize(expression: str) -> list[Token]:
    """
    Convert an expression string into tokens.

    Unary vs binary +/−:
      A + or - is unary when an operand is expected (start of expression,
      after another operator, or after '('). Otherwise it is binary.
    """
    if expression is None or not str(expression).strip():
        raise ExpressionError("Please enter an expression")

    s = str(expression)
    out: list[Token] = []
    i = 0
    expect_operand = True  # True when the next token should be a value / unary / '('

    while i < len(s):
        ch = s[i]

        if ch.isspace():
            i += 1
            continue

        # Number (integer or decimal)
        if ch.isdigit() or ch == ".":
            start = i
            dots = 0
            while i < len(s) and (s[i].isdigit() or s[i] == "."):
                if s[i] == ".":
                    dots += 1
                i += 1
            text = s[start:i]
            if dots > 1 or text == "." or text.startswith(".") and not any(c.isdigit() for c in text):
                raise ExpressionError(f"Invalid number: {text}")
            if text.endswith(".") and text.count(".") == 1 and text[:-1].isdigit():
                # Allow "3." as 3.0? Prefer rejecting trailing-dot-only-after-digits
                # Match visualizer: "3." has digits and one dot — JS accepts via Number().
                pass
            if not expect_operand:
                raise ExpressionError("Missing operator")
            out.append(Token("number", text, text))
            expect_operand = False
            continue

        if ch == "(":
            if not expect_operand:
                raise ExpressionError("Missing operator")
            out.append(Token("paren", "(", "("))
            i += 1
            expect_operand = True
            continue

        if ch == ")":
            if expect_operand:
                raise ExpressionError("Unexpected closing parenthesis")
            out.append(Token("paren", ")", ")"))
            i += 1
            expect_operand = False
            continue

        if ch in "+-*/":
            if expect_operand:
                if ch in "+-":
                    # Operand expected → unary + or -
                    out.append(
                        Token("operator", "u-" if ch == "-" else "u+", ch)
                    )
                    i += 1
                    # Still expecting an operand after unary (e.g. --5, -(3))
                    expect_operand = True
                    continue
                raise ExpressionError(
                    f"Unexpected operator '{ch}' (missing operand)"
                )
            # Binary operator
            out.append(Token("operator", ch, ch))
            i += 1
            expect_operand = True
            continue

        raise ExpressionError(f"Invalid character: {ch}")

    if expect_operand and out:
        raise ExpressionError("Expression ends with an operator")

    if not out:
        raise ExpressionError("Please enter an expression")

    return out


# ---------------------------------------------------------------------------
# Formatting / apply helpers
# ---------------------------------------------------------------------------

def format_number(n: float) -> str:
    if isinstance(n, float) and n.is_integer():
        return str(int(n))
    # Trim floating-point noise similarly to the JS visualizer
    return str(float(f"{n:.10f}"))


def apply_binary(a: float, op: str, b: float) -> float:
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        if b == 0:
            raise ExpressionError("Division by zero")
        return a / b
    raise ExpressionError(f"Unknown operator: {op}")


# ---------------------------------------------------------------------------
# Two-stack evaluation with optional step trace (for the HTML visualizer)
# ---------------------------------------------------------------------------

def build_states(tokens: list[Token]) -> list[dict[str, Any]]:
    """
    Run the two-stack algorithm and record each visualizer step.

    Algorithm sketch:
      values = []
      operators = []
      scan left → right
        number  → push values
        '('     → push operators
        ')'     → apply until '('
        unary   → push operators (highest precedence, right-assoc)
        binary  → while top has >= precedence, apply; then push
      finally apply remaining operators
    """
    values: list[float] = []
    operators: list[str] = []
    states: list[dict[str, Any]] = []

    def snap(
        ti: int,
        message: str,
        operation: str,
        finished: bool = False,
    ) -> None:
        states.append(
            {
                "tokenIndex": ti,
                "numbers": list(values),
                "operators": list(operators),
                "message": message,
                "operation": operation,
                "finished": finished,
                "result": values[0] if finished else None,
            }
        )

    def apply_top(ti: int, reason: str) -> None:
        if not operators:
            raise ExpressionError("Missing operator")
        op = operators.pop()

        if is_unary(op):
            if not values:
                raise ExpressionError("Missing operand for unary operator")
            a = values.pop()
            result = -a if op == "u-" else +a
            values.append(result)
            snap(
                ti,
                f"{reason} Apply {shown(op)} to {format_number(a)}.",
                f"{'-' if op == 'u-' else '+'}{format_number(a)} = {format_number(result)}",
            )
            return

        if len(values) < 2:
            raise ExpressionError("Missing operand")
        b = values.pop()
        a = values.pop()
        result = apply_binary(a, op, b)
        values.append(result)
        snap(
            ti,
            f"{reason} Apply {format_number(a)} {op} {format_number(b)}.",
            f"{format_number(a)} {op} {format_number(b)} = {format_number(result)}",
        )

    snap(-1, "Ready to scan from left to right.", "No operation yet.")

    for i, token in enumerate(tokens):
        if token.type == "number":
            values.append(float(token.value))
            snap(
                i,
                f"Read {token.value}: push it onto the numbers stack.",
                f"push {token.value}",
            )
            continue

        if token.value == "(":
            operators.append("(")
            snap(i, 'Read "(": push it onto the operators stack.', "push (")
            continue

        if token.value == ")":
            snap(i, 'Read ")": apply operators until "(".', "process )")
            found = False
            while operators:
                if operators[-1] == "(":
                    operators.pop()
                    found = True
                    snap(i, 'Pop the matching "(".', "pop (")
                    # After a parenthesized subexpression, apply a pending unary
                    # (e.g. -(3+4)) — unary is right-associative / high precedence.
                    if operators and is_unary(operators[-1]):
                        apply_top(i, "The parenthesized value is complete.")
                    break
                apply_top(i, "Closing parenthesis:")
            if not found:
                raise ExpressionError("Mismatched parenthesis")
            continue

        if is_unary(token.value):
            operators.append(token.value)
            snap(
                i,
                f"Read {token.display} as a unary operator because an operand is expected.",
                f"push {shown(token.value)}",
            )
            continue

        # Binary operator: pop higher-or-equal precedence first (left-to-right).
        # Using >= (not >) makes equal-precedence operators left-associative:
        #   10 - 3 - 2  →  (10 - 3) - 2
        #   20 / 5 * 2  →  (20 / 5) * 2
        snap(
            i,
            f"Read binary operator {token.display}: compare precedence.",
            f"consider {token.display}",
        )
        while (
            operators
            and operators[-1] != "("
            and precedence(operators[-1]) >= precedence(token.value)
        ):
            apply_top(i, f"{shown(operators[-1])} has higher or equal precedence.")

        operators.append(token.value)
        snap(
            i,
            f"Push {token.display} onto the operators stack.",
            f"push {token.display}",
        )

    snap(len(tokens), "End of input: apply all remaining operators.", "end of input")

    while operators:
        if operators[-1] == "(":
            raise ExpressionError("Mismatched parenthesis")
        apply_top(len(tokens), "End of input:")

    if len(values) != 1:
        raise ExpressionError("Invalid expression")

    snap(
        len(tokens),
        "Evaluation complete.",
        f"result = {format_number(values[0])}",
        True,
    )
    return states


def evaluate_expression(expression: str) -> float:
    """
    Evaluate an arithmetic expression using the two-stack algorithm.

    Example:
        evaluate_expression("2 + 3 * 4")  →  14.0
    """
    tokens = tokenize(expression)
    states = build_states(tokens)
    result = states[-1]["result"]
    if result is None:
        raise ExpressionError("Invalid expression")
    return float(result)


def evaluate_trace(expression: str) -> dict[str, Any]:
    """Return tokens + step states for the HTML visualizer."""
    tokens = tokenize(expression)
    states = build_states(tokens)
    # JSON-friendly token dicts; format final result like the UI
    finished = states[-1]
    if finished.get("finished") and finished.get("result") is not None:
        finished = {**finished, "result": finished["result"]}
        # Keep numeric result; UI formats it
    return {
        "tokens": [
            {"type": t.type, "value": t.value, "display": t.display}
            for t in tokens
        ],
        "states": states,
        "result": finished["result"],
    }


if __name__ == "__main__":
    # Quick manual checks when run directly
    demos = [
        "2 + 3",
        "2 + 3 * 4",
        "(2 + 3) * 4",
        "10 - 3 - 2",
        "20 / 5 * 2",
        "-5 + 3",
        "5 * -2",
        "-(3 + 4)",
        "3.5 + 2.5",
        "2 + -3 * 4",
    ]
    for expr in demos:
        print(f"{expr!r:20} -> {evaluate_expression(expr)}")
