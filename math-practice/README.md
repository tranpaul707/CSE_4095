# Math Meadow

An individual Math Practice coursework project in progress. The current version
contains a static project scaffold, tested arithmetic generation, and tested
session/persistence logic. The full interactive UI is **not implemented yet**.
The instructor's specification, phase list, and reference transcript are pending;
`specification.md` and `TODO.md` are explicitly provisional.

## Local development

Requires Node.js 22 or newer and npm. No API keys, account, or backend is needed.

```sh
cd /workspace/CSE_4095/math-practice # or your own checkout's math-practice folder
npm ci
npm run dev
```

The terminal reports the local development port (4173 by default). Stop with Ctrl+C.

## Validation

```sh
npm test          # arithmetic and session-state unit tests
npm run test:e2e  # production scaffold browser smoke test, not full app acceptance
npm run build    # output: dist/
npm run preview  # serves dist/, after building
```

Browser tests use `/usr/bin/chromium` when installed. On other machines run
`npx playwright install chromium` first. The cloud network blocked the Playwright
CDN download; the preinstalled Chromium avoids needing that download.

`npm test` currently covers 6,000 generated questions across four operations and
three provisional levels, answer-choice validity, similar questions, score
deduplication, session summaries, mistake review, reload, and corrupt/unavailable
storage. The browser smoke test only checks the current shell and module loading.

## Build and eventual deployment

The app is static HTML, CSS, and browser JavaScript. A static host can publish
`math-practice/dist` after running `npm ci && npm run build` in `math-practice`.
Navigation uses hash links, so it does not need server route rewrites. Deployment
configuration and real public-URL verification are later tasks. No deployment has
been performed or claimed.

## Development records

- `TODO.md`: phased tasks and remaining deliverables.
- `specification.md`: working assumptions awaiting the instructor references.
- `DEVELOPMENT_LOG.md`: factual AI development and debugging evidence.
- `tests/`: automated verification.

Progress will be stored only in the current browser once the state layer is wired
to the UI. It will not sync between devices. Do not submit this scaffold as a
completed assignment.
