# Classroom Survey
A responsive classroom survey app built with React, TypeScript, Vite, Tailwind, Supabase/PostgreSQL, Recharts, and QRCode.

## Run locally
Requires Node 22.12+ (Node 24 recommended).
```sh
npm ci
cp .env.example .env
npm run dev
```
Without real Supabase configuration, the app explicitly runs in **demo mode**. This stores surveys and responses in localStorage in one browser only. The demo has no real authentication, does not share data between devices, and is not suitable for collecting classroom responses. One sample draft is created on first visit; no fake submissions are generated.

## Connect Supabase
1. Create a Supabase project.
2. Run `supabase/migrations/001_initial.sql` once in SQL Editor on a fresh database.
3. In Authentication settings, disable **Allow new users to sign up**. This is essential: this version treats every authenticated account as an instructor.
4. In Authentication → Users, create the instructor account, with email confirmation enabled or confirmed manually. Deliver testing credentials privately, outside GitHub.
5. Set `.env` locally or your hosting build environment:
   - `VITE_SUPABASE_URL`: your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: public anon key or publishable key
6. Restart Vite after changing local variables; rebuild for deployment. The demo banner disappears when real configuration is present.
7. Log in and test the full workflow. Inspect tables in Supabase to verify persistence.

The frontend needs a public key, **never a service-role key**. Passwords and private keys must not be committed. Database RLS and RPC permissions provide the access boundary, not the secrecy of the public key.

## Architecture
The browser serves the React UI. Supabase Auth manages instructor sessions. Instructor reads and survey deletion/archive use Supabase data APIs under RLS. SQL RPCs save draft question sets atomically, switch the active survey, close surveys, and validate/save anonymous submissions. PostgreSQL stores five related tables. Student results reads are denied. Anonymous submission RPCs return no other students' data.

## Design decisions
- Single-instructor deployment: provision users manually and disable signup. Multiple instructors with isolated workspaces are out of scope.
- Only drafts can be edited. Duplicate a closed/active survey to make a new version without changing historical responses.
- Every question requires exactly one choice. True/false questions store exactly two choices.
- UUID-derived public slugs are generated when the draft is saved, retained on activation, and only readable publicly when active. This keeps links stable.
- React Router uses `/s/:slug`, matching API/UI; the TODO's `/s/:surveyId` is interpreted as the public identifier.
- Browser tokens prevent accidental duplicate responses; clearing storage or using another browser can bypass this. No student identity verification is claimed.
- The presentation response count polls every 5 seconds; result charts refresh on request. Realtime charts are future work.
- CSV includes metadata, then one row per submission; formula-leading values are neutralized.
- Public RLS hides closed surveys, so unknown and closed links share a helpful unavailable message; closing while answering produces a specific closed message from the submission RPC.

## Tests and build
```sh
npm test
npm run build
```
Tests execute the actual SQL migration in embedded PostgreSQL (PGlite), with mock Supabase roles and `auth.uid()`. They cover RLS, validation, duplicate submissions, activation, closing, cascade deletion, CSV escaping, and aggregation. They do not replace testing on hosted Supabase or a physical phone.

## Deployment on Render
Create a **Static Site** from `tranpaul707/CSE_4095`, branch `main`:
- Root Directory: `classroom-survey`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment: `NODE_VERSION=24`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Redirects/Rewrites: `/*` → `/index.html`, action **Rewrite** (200)

See [docs/RENDER.md](docs/RENDER.md) for the step-by-step guide. A Render Blueprint is also provided at `classroom-survey/render.yaml`; select this path when creating a Blueprint. The existing repository-root Netlify configuration is unrelated to this Render service.

Use the public Supabase URL and publishable/anon key in Render's build environment. Vite embeds these public values during the build, so changing them requires a rebuild. Never add passwords or service-role keys. Render hosts the React app; Supabase continues to host authentication and the database.

Other static hosts: build with `npm run build` and publish `dist`. `public/_redirects` provides SPA routing on Cloudflare Pages/Netlify; Render uses the rewrite rule above.

## Before submission
Follow `docs/TESTING.md`, collect real database screenshots, complete `docs/DEVELOPMENT_SUMMARY.md` with your own account setup and learning, and submit your GitHub URL, public deployment URL, report, AI history, and screenshots. Do not represent demo/browser-only storage as a deployed database app.
