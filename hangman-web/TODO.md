# Hangman web app — assignment implementation plan

The assignment in docs/ASSIGNMENT.txt controls scope. SPECIFICATION.md is the
unchanged original reference, including features excluded from this assignment.
The instructor's checked-off roadmap is preserved in docs/ORIGINAL_TODO.md;
its completion marks do not describe this app.

Implement one phase at a time. Verify each phase before marking it complete and
commit only this app's files. Keep all game decisions on the server. The engine
must work without Flask. Never return the answer while status is playing.

## Phase 1 — Scope and planning
- [x] Read the assignment, original specification, TODO, and instructor transcript.
- [x] Create a separate app folder inside CSE_4095.
- [x] Preserve the original specification and record the reduced scope.
- [x] Revise this plan before implementing code.
Verification: compare the plan with required components and submission criteria.

## Phase 2 — Game engine and word management
- [x] Add independent HangmanGame logic, six mistakes, validation, and end states.
- [x] Add Easy/Medium/Hard word lists and validated random selection.
- [x] Test correct, incorrect, repeated, invalid, winning, losing, and ended guesses.
- [x] Verify active game serialization omits the answer.

## Phase 3 — Flask REST API
- [x] POST /api/games, GET /api/games/{id}, POST /api/games/{id}/guess.
- [x] Unique IDs, separate in-memory game states, strict JSON validation.
- [x] Return JSON errors and appropriate status codes.
- [x] Test API flows, isolation, invalid requests, and answer disclosure.

## Phase 4 — Browser interface
- [x] Difficulty selection, start/new game, letter buttons, and physical keyboard.
- [x] Pattern, guessed letters, mistakes remaining, and progressive drawing.
- [x] Win/loss and request error messages; restart without reload.
- [x] Responsive, accessible controls; fetch the server for every game decision.

## Phase 5 — Integration and testing
- [x] Run engine/API tests and real browser checks for all three difficulties.
- [x] Verify wins, losses, new games, rendering, keyboard, and request failures.
- [x] Check mobile layout, duplicate input, and active response secrecy.
- [x] Document local commands and manual Developer Tools walkthrough.
- [ ] Student: play locally and inspect one request/JSON response in Chrome.

## Phase 6 — Deployment
- [ ] Prepare dependencies, Gunicorn, and Render settings for this monorepo.
- [ ] Verify production start command locally.
- [ ] Push phase commits to GitHub.
- [ ] Create/connect hosting service and obtain public HTTPS URL.
- [ ] Play a complete game on the public service and verify required API routes.

## Phase 7 — Submission
- [ ] README: installation, architecture, API, tests, deployment, limitations.
- [ ] Prepare factual development notes and demo/report guidance.
- [ ] Student: finalize 1–2 page PDF report including personal reflection.
- [ ] Student: record 2–3 minute demo including Developer Tools.
- [ ] Submit repository URL, live URL, PDF, and recording through HuskyCT.

## Explicitly outside scope
Terminal clients, bots, evaluation, scoring/leaderboards, replay/logging utilities,
accounts, multiplayer, databases, and additional API features. No instructor
completed source code is copied. Difficulty changes word selection, not lives.
