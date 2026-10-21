# Math Meadow

A Math Practice application for children ages 7–12, built with React, TypeScript,
React Router, and Vite. No account, backend, API key, analytics, or external font
service is required to use the app.

Live application: **https://math-meadow-tranpaul707.netlify.app**

Source folder: `math-practice/` in `tranpaul707/CSE_4095`.

## Run locally

Use **Node.js 24+** and npm.

```sh
cd math-practice
npm ci
npm run dev
```

The development server uses port 4173 and reports its address in the terminal.
It fails clearly if that port is occupied. Stop with Ctrl+C.

## What it does

- Addition, subtraction, multiplication, and exact integer division at four levels.
- Select one or more operations, a level, and 5/10/20 questions or continuous practice.
- Select an answer, flip the card, then self-report right or wrong. Selecting an
  answer alone never scores it. Each question can be recorded once.
- Session summaries, overall/operation/difficulty statistics, and recent sessions.
- Saved mistakes, nearby/reversed/inverse review questions, prioritized review,
  and configurable mastery (three successful similar questions by default).
- Working sound, animation, explanation, feedback, and default-practice settings.
- Refresh recovery, navigation confirmation, storage warnings, and confirmed resets.
- Keyboard shortcuts 1–4 for choices, native keyboard controls, reduced-motion
  support, accessible labels, and phone/tablet/desktop layouts.

A self-report determines statistics and mistake tracking even when it differs
from the mathematical correctness of the selected answer, as the specification
requires. Both the selected answer and correct answer are retained in each attempt.

## Test and build

```sh
npm test               # arithmetic, state/persistence, and component tests
npm run lint
npm run format:check
npm run build          # TypeScript checking, then production output in dist/
npm run test:e2e       # real browser journeys, production routes, and axe checks
npm run preview        # production preview, after building, on port 4174
npm run verify         # formatting, lint, unit/component tests, and production build
```

Browser tests prefer `/usr/bin/chromium` when available. On other machines, install
Playwright's browser once with `npx playwright install chromium`. Browser tests
start and stop their own production preview; stop any existing preview on port
4174 before running them. Test artifacts are ignored by Git.

See [docs/TESTING.md](docs/TESTING.md) for verified outcomes and manual limitations.

## Data and architecture

- `src/math.ts`: four-level generation, validation, distractors, and related facts.
- `src/store.ts`: pure session transitions, mastery, statistics, and storage validation.
- `src/context.tsx`: shared React state and synchronous persistence before navigation.
- `src/App.tsx`: routes, setup, question cards, session summaries, and navigation guards.
- `src/StatisticsPage.tsx` / `src/SettingsPage.tsx`: lazy-loaded progress/preferences.
- `src/types.ts`: shared data models.

Data is stored under `mathPractice.*` keys in localStorage, with schema version 1.
It persists until reset or browser data is cleared. It is specific to the website
origin and browser profile; it does not sync across devices or transfer from a
local development address to a public site. No expiry is imposed.

Up to 5,000 detailed attempts are retained; older attempts are folded into lifetime
statistics. Up to 100 completed sessions are retained, with the latest 20 displayed.
Mistake patterns remain until reset. Settings and each storage category are
validated separately, so corruption in one category does not wipe unrelated data.
Storage errors show a warning while practice continues in memory. Newer unknown
schema versions are protected from writes until an explicit Clear All Data action.

## Netlify

The repository-root `netlify.toml` selects this folder automatically:

| Setting           | Value                         |
| ----------------- | ----------------------------- |
| Production branch | `main`                        |
| Base directory    | `math-practice`               |
| Build command     | `npm run build`               |
| Publish directory | `dist` (relative to the base) |
| Node.js           | 24                            |

`public/_redirects` also supplies the SPA fallback. React routes such as
`/statistics` and `/practice/setup` must load correctly when opened directly.
The application is publicly deployed. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
for deployment details and connecting GitHub for automatic future builds.

## Assignment records

The supplied [specification.md](specification.md) and
[original checklist](docs/INSTRUCTOR_TODO.md) are retained as requirements.
[TODO.md](TODO.md) tracks the combined milestones. [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md),
[report draft](docs/DEVELOPMENT_REPORT_DRAFT.md), and
[AI evidence](docs/AI_CONVERSATION_EVIDENCE.md) support the submission.
The student must review the report, add their own reflection/screenshots, supply
review deployment details, and submit through HuskyCT.
