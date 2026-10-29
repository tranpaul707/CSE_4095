# Development record

## Phase 1 — Scope and planning
Reviewed the supplied assignment and reference materials. The original project
includes clients, bots, evaluation, leaderboards, and replay that this assignment
does not require. Preserved the specification and original TODO, and wrote a new
unchecked roadmap for the required app. The existing CSE_4095 repository holds
the app under hangman-web; no nested repository is needed.

The plan was reviewed against all five required application components and the
four submission deliverables before implementation began.

## Phase 2 — Engine and words
Implemented an independent engine and three original word lists (143 words total).
Six incorrect guesses are allowed at every difficulty. Guesses accept A–Z,
normalize case, and reject duplicates, invalid input, and moves after completion
without changing state. Only completed snapshots include the answer.
Verification: `python -m unittest discover -s tests -v` — 15 tests passed.
