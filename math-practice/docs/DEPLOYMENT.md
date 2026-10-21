# Netlify deployment

**Public app:** https://math-meadow-tranpaul707.netlify.app

**Netlify project:** https://app.netlify.com/projects/math-meadow-tranpaul707

The first production release was published through the Netlify API from the tested
static ZIP. It is publicly accessible without Netlify login. The homepage and all
application routes return HTTP 200. See TESTING.md for the live-browser results
and netlify-deployment.json for the non-secret site/deployment IDs.

## Build configuration

The root netlify.toml builds math-practice/ and publishes math-practice/dist/.
The app-local configuration supports projects whose base is already set manually.
Node.js 24 is selected. public/_redirects is copied into dist and supplies the
SPA fallback for direct navigation and refresh.

| Setting           | Value                |
| ----------------- | -------------------- |
| GitHub repository | tranpaul707/CSE_4095 |
| Production branch | main                 |
| Base directory    | math-practice        |
| Build command     | npm run build        |
| Publish directory | dist                 |

## Enable automatic GitHub deployments

The initial API/ZIP deployment does not establish a GitHub repository connection.
To deploy automatically after future pushes:

1. Open the Netlify project above while signed in.
2. Open project configuration and its build/deploy settings, then link a Git repository.
3. Authorize the Netlify GitHub integration for tranpaul707/CSE_4095.
4. Select main and confirm the build settings in the table above.
5. Trigger a build and verify the published version.

This account authorization is separate from the Netlify API token. Until it is
connected, future code changes need another explicit deployment of the built dist
output; a Git push alone does not update the public site.

## Cloud deployment access

The application itself requires no credentials or environment variables.
NETLIFY_AUTH_TOKEN is a secure deployment-only environment binding scoped to
api.netlify.com. Never place it in source code, a VITE_ variable, or chat.
The environment permits api.netlify.com, app.netlify.com, and *.netlify.app.

A new Netlify site initially inherited login protection. The site-specific
sso_login setting was disabled for this public assignment site. No login should
appear when visiting the production URL.

The cloud Chromium browser also needed write access to its existing NSS database
at /home/agent/.pki/nssdb to load the already trusted environment proxy CA. Tests
preserved certificate verification; no certificate errors were bypassed.

## Release checks

- Every app route loads directly and after refresh.
- Full sessions, final-question mistakes, summaries, review mastery, and statistics work.
- Settings and active-card state survive refresh on the public origin.
- Confirmed reset, keyboard controls, layouts, and accessibility are tested.
- Real-device listening, screen-reader review, and other browser engines remain manual.
