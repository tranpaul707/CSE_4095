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

## Phase 3 — Flask API
Added the three required routes, unique UUIDs, independent in-memory games,
strict JSON shapes, HTTP 201/200 success and 400/404/409/413/415 errors. Game
requests are serialized with a lock so concurrent guesses cannot corrupt state.
API responses use Cache-Control: no-store. Dependencies are in a local virtual
environment and excluded from Git. Verification: 25 engine/word/API tests passed.

## Phase 4 — Browser interface
Built a responsive, self-contained HTML/CSS/JavaScript client, letter buttons and
physical keyboard handling, six-part SVG, previous guesses, chances, and restart.
The browser contains presentation only and re-fetches state after failed guesses
to recover if a response was lost. Controls disable while a request is pending.
Verification: JavaScript syntax check, 25 backend tests, Chromium smoke test
(start, click guess, DOM update), no browser exceptions, desktop screenshot review.

## Phase 5 — Integration testing
26 engine/word/API tests passed, plus real Chromium checks for all difficulties,
full wins/losses, each drawing stage, click/keyboard input, duplicate requests,
restart, lost-response recovery, expired-game recovery, active response secrecy,
and 320px/390px layouts. No JavaScript exceptions were observed.
A screenshot review caught controls clipped inside an overflow-hidden panel at
320px despite no page-level overflow. Fixed shrinking grid tracks and stacked
setup controls; added explicit control-boundary assertions and reran the browser
suite successfully. This is a concrete challenge to discuss in the report.
The student's local play and Chrome Developer Tools demonstration remain pending.

## Phase 6 — Deployment preparation
Added a Render Blueprint and manual Web Service settings with rootDir hangman-web,
Python 3.12.14, and one Gunicorn worker. The existing Netlify application cannot
run this Flask API as a static site and its configuration was left untouched.
Production verification: started Gunicorn on local port 5050, served the frontend,
created and retrieved games at all difficulties, played each through to completion
over real HTTP, and verified active secrecy and terminal reveal. All passed.
Render account/service creation and public HTTPS verification remain pending.

## Phase 7 — Submission preparation
Prepared README, local and optional browser testing commands, deployment guide,
a report draft with factual results and real conversation prompts, and a demo
outline/checklist. Deployment and personal reflection are explicitly unfinished.
All phase commits were pushed to the hangman-web-app branch in the existing
GitHub repository. Main and the other course applications were not modified.

## Remaining student/account steps
- Run locally, play, and inspect a request/response in Chrome Developer Tools.
- Create the Render Web Service using docs/DEPLOYMENT.md; share the HTTPS URL
  so deployment verification can be completed. No Render credentials or connected
  browser-control tool were available in this session.
- Finish the report with actual deployment results and personal reflection, export
  its PDF, record the demo, and submit through HuskyCT.
