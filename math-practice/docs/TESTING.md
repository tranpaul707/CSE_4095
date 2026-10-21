# Verification record

Tests are executable evidence for this project. The example transcript's reported
results are not used as evidence.

## Automated checks

- TypeScript checking and a Vite production build.
- ESLint and Prettier checks.
- Vitest: 36 passing arithmetic, state/persistence, statistics, and React component tests.
  Generation tests run 500 questions for each of 16 operation/level combinations
  (8,000 total), with related review generation for each.
- Playwright: 17 production-build browser tests using installed Chromium.
- Full sessions for all four operations; a final-question mistake is available on
  the summary immediately. Practice Again creates a fresh session.
- Explicit selection/flip/self-report order; selected answers and flipped cards
  survive refresh; duplicate results are blocked.
- Continuous practice and explicit ending, navigation cancel, summaries, persisted
  defaults, explanation controls, reset confirmation, and unrelated-data preservation.
- Related review questions and three-success mastery; statistics persist.
- Mixed practice using keyboard controls; reduced-motion mode.
- Recoverable storage failures, including saving earlier in-memory results after
  storage becomes available again.
- Web Audio nodes are scheduled when sound is enabled and not when disabled.
- Encouraging feedback remains visible before automatic advancement.
- Axe WCAG A/AA checks on Home, Setup, Statistics, and Settings at 375, 768, and
  1280 pixel widths, plus card front/back and a populated summary; no violations
  in the verified run. These include real-browser color checks.
- No horizontal page overflow at the tested widths; Home/Practice screenshots inspected.
- At 5,000 attempts: statistics compute within the test's 250 ms budget and a
  serialized sample state stays under 4 MB. Archiving preserves lifetime counts.

## Bugs found and fixed

1. Navigation protection blocked the completion redirect using stale active-session
   state. The guard now checks the provider's latest synchronous state.
2. Restarting from a summary could copy completedAt to the new session. New sessions
   now copy only setup fields and reset session identity/counters.
3. After a failed storage write, a later answer-selection update could omit earlier
   unsaved history. The provider tracks failed persistence and retries the full state.

## Manual/external checks still required

- Actual public Netlify deployment, all direct routes, and refresh on the public origin.
- Listening to the sounds on real hardware, including mobile autoplay behavior.
- A real screen reader, physical-device interaction, and browser zoom/larger system fonts.
- Safari, Firefox, and Microsoft Edge engine testing. Chromium automation does not
  establish compatibility in those browsers.

## Reproduce

```sh
npm ci
npm run verify
npm run test:e2e
```

Browser tests build the application and use port 4174. Install Chromium with
`npx playwright install chromium` when /usr/bin/chromium is absent. All application
routes must also be checked on the actual deployed site before submission.
