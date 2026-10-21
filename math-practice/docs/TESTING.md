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

## Public deployment verification

The same 17 production-browser tests passed on
https://math-meadow-tranpaul707.netlify.app after deployment. Homepage, setup,
session, summary, statistics, and settings routes also returned HTTP 200 to
unauthenticated HTTPS requests. Direct routes, refresh persistence, full sessions,
last-question mistakes, mastery, defaults, confirmations, responsive layouts, and
accessibility were checked on the actual public origin.

Reproduce against the public site with:

```sh
PLAYWRIGHT_BASE_URL=https://math-meadow-tranpaul707.netlify.app npm run test:e2e
```

This option uses the existing public deployment rather than starting a local server.
The cloud browser required write permission for its existing NSS trust database so
it could load the environment proxy CA. TLS verification remained enabled.

## Manual/external checks still required

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
