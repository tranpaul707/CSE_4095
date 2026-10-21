# Math Meadow — development report draft

**Student review required:** This is a factual draft based on the recorded work.
Add your name, personal reflection, screenshots, verified public URL, and any
instructor-required formatting. Aim for 2–3 pages after editing. Do not describe
manual testing or deployment as complete until you have performed it.

**Repository:** https://github.com/tranpaul707/CSE_4095/tree/main/math-practice

**Deployed application:** https://math-meadow-tranpaul707.netlify.app

## Development approach

The project began by translating the assignment brief into a provisional checklist.
The student then supplied the official software specification, the 22-phase TODO
list, and a 246-page example Cursor transcript. These documents clarified several
requirements that were absent from the brief: React, four exact difficulty levels,
explicit self-reporting after a card flip, continuous practice, and configurable
mastery of saved mistake patterns. Implementation paused while the materials were
reviewed and then aligned the foundation with those requirements.

For manageable progress, the 22 phases were combined into eight milestones:
foundation/navigation, arithmetic, practice flow, persistence/settings, mistake
review, statistics, accessibility/testing/performance, and release preparation.
Testing happened throughout development. Meaningful commits preserve the initial
plan, the provisional foundation, the official React/arithmetic milestone, and
subsequent application/release work. The source is kept in math-practice within
the existing coursework repository.

The final architecture uses React and TypeScript with Vite and React Router.
Pure functions implement arithmetic and session transitions. React Context makes
state available to routed pages. Statistics and Settings load on demand. No
backend or account is needed; data remains in browser localStorage.

## Prompting strategy

Three useful directions from the actual conversation were:

1. “Read through this assignment, plan a list of todos, working through each phase.”
   This established an incremental process with a visible checklist rather than
   assuming a single code-generation step would satisfy the assignment.
2. “How does the mistake review tracking work? How does it change the user
   experience?” Clarifying this behavior connected the data model to practice:
   missed patterns produce related questions, priority depends on difficulty for
   the child, and successful review eventually removes patterns from the active pool.
3. “Perform tests as you go ... let me know if any bugs pop up.” This made test
   evidence and short debugging updates part of each development milestone.

The discussion also explicitly clarified that self-reported correctness controls
scoring. The selected answer and correct answer are stored, but the app does not
override the child's report. That distinction shaped both the interface and tests.

## Debugging experience

One real browser defect involved the navigation guard. At the end of a fixed
session, results were saved, but the automatic redirect to the summary triggered
“Leave this practice?” The guard briefly used a previously registered state
snapshot in which the session was still active. Pure state tests passed because
they did not exercise the router's effect ordering.

The correction made the guard consult the provider's latest synchronously updated
session state. A real-browser regression runs a five-question session for each
operation, marks the final question wrong, and verifies the summary and enabled
mistake-review action. A separate test confirms that leaving unfinished practice
still prompts and that canceling keeps the child in the session.

Review also caught a Practice Again issue: copying an entire finished session
could carry completedAt into the next session. The fix copies only configuration
fields and creates a fresh ID and counters. The regression checks both the fresh
session and its validity after saving/reloading.

The supplied transcript was useful for recognizing similar risks, but its prompts,
intentional bug instructions, external repository URLs, and claimed test outcomes
were treated as reference material. They were not executed or adopted as evidence
for this project.

## Testing and verification

Arithmetic tests cover all four operations and difficulty levels, including 8,000
seeded generated questions and their related reviews. They verify numeric bounds,
nonnegative subtraction, exact division, unique distractors, randomized positions,
and bounded fallbacks when random choices repeat. State tests exercise the
select/flip/report sequence, duplicate prevention, continuous sessions, mastery,
resets, storage failures, and archived totals. React Testing Library covers
selectors and metric rendering.

Playwright runs production-build browser journeys for sessions, refresh recovery,
review mastery, settings, confirmations, keyboard controls, feedback timing, and
Web Audio scheduling. Axe checks run on the main pages at phone, tablet, and desktop
widths and on question-card faces and a populated summary. Screenshots were also
inspected. TypeScript, lint, formatting, and the production build are release checks.

Automated checks do not prove that audio is audible on every device or that a real
screen reader reads every transition naturally. Physical-device listening and
Safari/Edge testing remain manual checks. Public-site checks are recorded in docs/TESTING.md after Netlify deployment.

## Persistence and release

Practice survives reloads and browser restarts on the same origin and browser
profile. Each result is saved before advancing. Settings, attempts, sessions,
mistakes, archive totals, and active-session snapshots have separate validation.
Old detailed attempts are archived beyond 5,000 records while lifetime totals remain.
Reset Statistics preserves settings; Clear All Data resets the application's own
keys without clearing unrelated browser data.

Netlify configuration selects math-practice as the base and dist as the output,
with an SPA fallback so deep links can load after refresh. The first deployment was initially blocked by missing authentication and network
access. After the student supplied a token securely and applied the environment
settings, the agent created the Netlify site and published the tested production
ZIP. The new site initially required Netlify login; this site-specific protection
was disabled to meet the public-access requirement. All app routes then returned
HTTP 200 without login. GitHub continuous deployment remains an optional account
connection; the initial release was deployed through the Netlify API.

## Personal reflection — complete in your own words

Explain which parts you now understand well, which generated decisions you reviewed
or questioned, and what you would do differently next time. Discuss the benefit of
fast scaffolding and repeatable tests, along with the limitation demonstrated by a
router bug that unit tests alone did not catch. Include screenshots and original
conversation excerpts that support your own account of the development process.
