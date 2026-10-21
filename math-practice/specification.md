# Working specification: Math Meadow

Source: the assignment brief supplied in this chat. This is an implementation
interpretation, not the missing instructor-provided specification.

## Audience and scope
A child-friendly, responsive arithmetic practice app for ages 7–12. No login,
backend, API keys, or personal information. Publish as a static website.

## Arithmetic
- Four selectable operations, individually or mixed.
- Easy: addition/subtraction operands 0–10; multiplication/division facts 1–5.
- Medium: addition/subtraction operands 0–50; multiplication/division facts 1–10.
- Challenge: addition/subtraction operands 0–100; multiplication/division facts 1–12.
- Subtraction results are nonnegative. Division uses a nonzero divisor and an
  integer quotient, generating the dividend from two bounded factors.
- Four unique numeric choices, exactly one correct. Similar questions preserve
  the operation and difficulty and differ from the original question.

## Sessions and cards
- Configure operations, difficulty, and 5, 10, or 20 questions.
- Pick an answer to lock and score it once. Show feedback and a short arithmetic
  explanation. Advance with Next; do not automatically skip feedback.
- Alternatively reveal the answer, then explicitly choose “I got it” or
  “Not yet”; self-reported results are labeled in history.
- Track attempted/correct/incorrect counts and display a final summary.
- Save an unfinished session and its feedback state across refreshes.
- Navigating among Practice, Mistakes, and Statistics must not discard progress.
- Starting over during an unfinished session requires confirmation; prior scored
  attempts remain in overall statistics even if a session is abandoned.

## Mistakes and statistics
- Store incorrect questions with the submitted answer, time, and review status.
- Allow exact review or fresh similar practice from a selected saved mistake.
- A correct review resolves its source mistake; a wrong review keeps it open.
- Include review attempts in all-time counts; distinguish review sessions.
- Show attempts, correct, incorrect, accuracy, open mistakes, per-operation
  results, and recent completed sessions. Empty states must be useful.

## Persistence and accessibility
- Store versioned data locally in the current browser; no cross-device sync.
- Gracefully recover from corrupt data and show a warning for unavailable storage.
- Provide a destructive reset action behind explicit confirmation.
- Semantic controls, visible focus, keyboard operability, readable contrast,
  reduced-motion support, generous tap targets, and narrow-screen layouts.

## Verification and delivery
- Unit tests for arithmetic, session transitions, review, scoring, and persistence.
- Browser tests for core user journeys and production output.
- Static deploy configuration, reproducible commands, meaningful Git milestones,
  factual development log, report draft, and selected conversation evidence.
- Do not claim public deployment or instructor-reference compliance until verified.
