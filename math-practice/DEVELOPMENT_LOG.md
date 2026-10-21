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

## Complete practice, persistence, review, and statistics milestone

Implemented setup, four-level arithmetic, question cards, self-reported scoring,
fixed/continuous sessions, summaries, recoverable localStorage, working settings,
prioritized related-question review, configurable mastery, and all statistics views.
Detailed attempts are archived after 5,000 while lifetime counts remain. Settings
and Statistics are lazy-loaded. Summaries track the operations/levels actually practiced.

Browser regression found a real guard bug: automatic completion was blocked by a
previously registered navigation callback that still saw an active session. The fix
reads synchronously updated session activity through the provider. Full sessions for
all operations and ordinary leave-confirmation tests now pass. Inspection also found
Practice Again copied completedAt into new sessions; new sessions copy configuration
fields explicitly, with a save/reload regression. Storage retry now includes data
from prior failed writes after storage becomes available again.

Validation before the feature push: 35 unit/component tests and all 17 production
browser tests passed. Final release verification includes an additional corrupted-
archive/schema test. Coverage includes 8,000 generated questions and related reviews,
reload recovery, last-question mistakes, mastery, continuous sessions, keyboard
controls, confirmed resets, feedback timing, Web Audio scheduling, storage failures,
and axe checks at three widths plus both card faces and a populated summary.
Home and practice screenshots were inspected. Actual audible output, real screen-
reader listening, and physical Safari/Edge/device checks remain manual.

## Netlify preparation

The student requested Netlify setup. Added repository-root netlify.toml selecting
math-practice as the base, npm run build, dist as publish directory, Node 24, and
SPA route fallback. The app-local configuration and public/_redirects support the
same output. Actual API and dashboard requests received proxy 403; required token
and site bindings were not present. Saved a secure NETLIFY_AUTH_TOKEN requirement
and domains api.netlify.com, app.netlify.com, and *.netlify.app in the environment
draft. This is configuration persistence, not runtime application or site publication.
The public site and post-deploy acceptance checks remain pending account access.

## Final release checks

Formatting, ESLint, all 36 unit/component tests, TypeScript checking, and the production
build pass. Netlify TOML build/base/publish settings were parsed and checked against
the real dist output, including the copied SPA _redirects file. Final production
browser results and push are recorded after this check completes.

Final production browser run: all 17 tests passed after the last state/persistence
changes. No known failing automated checks remain. Release documentation and the
Netlify configuration are committed with the tested application. The deployable
static ZIP is available at /workspace/artifacts/math-meadow-netlify.zip; creating
the Netlify site and public-origin testing still require account/network access.

## Public Netlify release verified

After the student saved the secure token binding, the Netlify /user endpoint returned
200 and the account had no existing sites. Created math-meadow-tranpaul707 in the
student's team and deployed the tested production ZIP. The deploy reached ready.
The new site initially inherited Netlify login protection; disabled the site's
sso_login setting for the intended public assignment. All six app routes then
returned 200 without login.

Cloud Chromium initially could not load its existing trusted proxy certificates
because NSS requires a read/write database. Granted turn-scoped write access to
the existing /home/agent/.pki/nssdb; no certificate checking was disabled.
All 17 Playwright tests subsequently passed against the actual public URL:
https://math-meadow-tranpaul707.netlify.app. Formatting and lint also pass.
Deployment metadata is in docs/netlify-deployment.json. The initial release uses
API/ZIP deployment; the GitHub integration still needs an account connection for
automatic future builds. Report review and physical-device/screen-reader checks
remain student actions.
