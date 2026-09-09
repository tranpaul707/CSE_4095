# Two-Stack Expression Evaluator

Interactive visualizer for Dijkstra’s two-stack arithmetic algorithm, including unary `+` / `-`.  
The core evaluation runs in **Python** (`evaluator.py`); the HTML page is the UI.

## How to run

From this directory (`CSE_4095/Assignment_2`):

```bash
python3 app.py
```

Then open [http://127.0.0.1:5050/](http://127.0.0.1:5050/) in your browser.

No third-party packages are required (stdlib only).

Stop the server with `Ctrl+C`.

### Optional: run unit tests

```bash
python3 test_evaluator.py
```

### Optional: evaluate from the CLI

```bash
python3 -c "from evaluator import evaluate_expression; print(evaluate_expression('2 + 3 * 4'))"
```

## Files

| File | Role |
| --- | --- |
| `evaluator.py` | Two-stack tokenizer + evaluator (`evaluate_expression`) |
| `app.py` | Serves the HTML and `/api/trace` / `/api/evaluate` |
| `two_stack_expression_visualizer_unary.html` | Existing visualizer UI (calls Python API) |
| `test_evaluator.py` | Representative test cases |

## Controls

| Button | Behavior |
| --- | --- |
| **Load Expression** | Send the expression to Python and load step states |
| **Previous / Next** | Step the two-stack simulation backward / forward |
| **Play / Pause** | Auto-run steps |
| **Reset** | Jump back to the first step |
