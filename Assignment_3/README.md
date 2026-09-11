# Benford's Law

Analyze first-digit distributions of Fibonacci numbers, powers of 2, and factorials, and compare them with Benford's Law — without constructing enormous integers.

## How to run

From this directory (`CSE_4095/Assignment_3`):

```bash
python3 benford.py fibonacci 1000000
python3 benford.py power2 1000000
python3 benford.py factorial 1000000
```

Additional experiment (powers of 3):

```bash
python3 benford.py power3 1000000
```

Optional grouped bar chart (requires matplotlib):

```bash
pip install -r requirements.txt
python3 benford.py fibonacci 1000000 --plot
```

## Sequences

| Argument | Terms for `n` |
| --- | --- |
| `fibonacci` | `F_1 … F_n` (`F_1=1`, `F_2=1`, …) |
| `power2` | `2^0 … 2^{n-1}` |
| `factorial` | `1! … n!` |
| `power3` | `3^0 … 3^{n-1}` |

All use logarithmic leading-digit methods so `n = 1_000_000` stays fast and memory-light.

## Files

| File | Role |
| --- | --- |
| `benford.py` | CLI program (required submission) |
| `requirements.txt` | Optional `matplotlib` for `--plot` |
