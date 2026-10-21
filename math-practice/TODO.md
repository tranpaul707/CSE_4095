# Math Practice — implementation checklist

This provisional plan is derived from the pasted assignment brief. The instructor's
`specification.md`, `TODO.md`, and example PDF transcript have not been supplied.
Reconcile this plan with those references before claiming full specification compliance.

## Phase 1 — requirements and foundation
- [x] Read the assignment and map its features and deliverables.
- [x] Record assumptions and acceptance criteria in `specification.md`.
- [ ] Create a standalone static web project with install, dev, build, and test commands.
- [ ] Create a responsive, accessible shell and navigation.
- [ ] Begin a factual AI development log and make an initial milestone commit.

## Phase 2 — arithmetic engine
- [ ] Generate addition, subtraction, multiplication, and division questions.
- [ ] Implement three age-appropriate difficulty levels with documented ranges.
- [ ] Keep subtraction nonnegative and division exact with nonzero divisors.
- [ ] Generate four distinct answer options with exactly one correct answer.
- [ ] Test arithmetic invariants, difficulty boundaries, and similar-question generation.

## Phase 3 — question cards and sessions
- [ ] Configure operations, difficulty, and session length.
- [ ] Support multiple-choice answers, reveal, and explicit correct/incorrect self-assessment.
- [ ] Show clear feedback and an explanation, then advance deliberately.
- [ ] Prevent duplicate scoring and show session progress.
- [ ] Finish with an accurate summary and retry/new-session controls.

## Phase 4 — mistakes and targeted review
- [ ] Save incorrect questions and answers.
- [ ] Review saved mistakes and practice exact questions or similar questions.
- [ ] Track review outcomes and resolve a mistake after a correct review.
- [ ] Handle an empty mistake collection clearly.

## Phase 5 — statistics and persistence
- [ ] Save attempts and completed session history in versioned localStorage.
- [ ] Show totals, accuracy, per-operation results, and recent sessions.
- [ ] Restore an unfinished session after reload without duplicate scoring.
- [ ] Handle corrupt/unavailable storage and provide a confirmed reset control.

## Phase 6 — validation and polish
- [ ] Run automated engine/state tests covering all four operations and levels.
- [ ] Exercise actual browser flows: cards, scoring, summary, review, statistics, reload.
- [ ] Check keyboard controls and mobile layout; inspect for runtime errors.
- [ ] Run a production build and smoke-test the built application.
- [ ] Record real failures, fixes, commands, and results in `DEVELOPMENT_LOG.md`.

## Phase 7 — GitHub and public deployment
- [ ] Write README instructions for local development, tests, build, and deployment.
- [ ] Add static-host configuration and make meaningful milestone commits.
- [ ] Push source to the chosen GitHub repository using available authorization.
- [ ] Deploy to a public host when hosting access is available.
- [ ] Test the actual public URL, refresh, navigation, and data persistence.

## Phase 8 — submission materials
- [ ] Prepare a report draft grounded in the recorded implementation and test results.
- [ ] Collect initial request, feature refinement, and debugging/testing conversation evidence.
- [ ] Have the student add their own reflection and review the report (2–3 pages).
- [ ] Fill in verified GitHub and public app URLs.
- [ ] Reconcile all requirements with the missing instructor reference materials.
- [ ] Submit the four deliverables through HuskyCT (student action).
