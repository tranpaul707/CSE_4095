# AI-assisted development log

## Initial request and requirements
The student supplied the assignment brief and asked: “Read through this assignment,
plan a list of todos, working through each phase.”

The brief requires an arithmetic practice app, incremental development, meaningful
Git commits, testing, a public deployment, a 2–3 page development report, and AI
conversation evidence. The referenced instructor specification, TODO file, and PDF
transcript were not present. The agent asked about these and created a clearly
provisional specification and phased checklist from the available brief.

Implementation decisions, test results, and debugging observations will be added
as work is actually completed. Personal reflection must be written or reviewed by
the student; this log does not invent a student's experiences.

## Foundation milestone
- Created a separate `math-practice/` project within the existing coursework
  repository. It uses browser JavaScript modules and a dependency-free static
  build, with Playwright as a development/test dependency.
- Saved the requirements interpretation and eight-phase checklist.
- Committed the initial project as `69e2789`.

## Arithmetic and state foundation milestone
- Implemented four operations, three provisional ranges, nonnegative subtraction,
  exact integer division, four unique choices, balanced mixed-operation sessions,
  and similar questions that differ from their source.
- Implemented pure session transitions, single-score protection, explicit
  assessment after reveal, mistake review, statistics, and versioned browser
  storage with validation and recoverable errors.
- These state capabilities are currently tested logic, not completed UI features.
- `npm test`: **20 passed**, including 500 generated questions for each of the
  12 operation/difficulty combinations (6,000 total).
- Committed the engine and state foundation as `aee6524`.

## Browser tooling/debugging interaction
Expected: download a test browser and validate the production scaffold.
Actual: `npx playwright install chromium` received HTTP 403 “Domain forbidden”
from `cdn.playwright.dev`. This was a network policy restriction, not an app defect.
Diagnosis: checked for an existing browser and found `/usr/bin/chromium`.
Correction: configured Playwright to use the installed Chromium, falling back to
the normal Playwright browser on other systems. No TLS or integrity checks were
disabled and no network permissions were broadened.
Verification: `npm run test:e2e` built the static production output and passed its
one scaffold smoke test, including page/module loading, semantic navigation, a
keyboard-accessible skip link, and no browser runtime errors. This does not prove
the unfinished interactive application works.

## Reference-material checkpoint
The student answered “I’ll provide the reference materials.” Further UI/feature
implementation is waiting for those files so the official phases and detailed
requirements can govern the work. The working specification and difficulty ranges
remain provisional. No push, public deployment, report submission, or full
specification-compliance claim has been made.

## Official specification implementation: foundation and arithmetic
Replaced the provisional shell with React, Vite, TypeScript, and React Router.
Saved the supplied specification and original 22-phase checklist. Implemented the
four official difficulty levels, zero multiplication facts, larger multiplication,
valid integer division, operation-specific distractors, and nearby/reversed/inverse
review candidates. Added pure transitions enforcing selection, flip, then explicit
self-report. The earlier automatic-scoring design is superseded.
The React shell passes the production browser smoke test. Arithmetic/state tests
are run before this milestone is committed; detailed final results follow later.
