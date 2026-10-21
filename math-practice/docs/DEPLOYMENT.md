# Netlify deployment

## Prepared configuration

The root `netlify.toml` is discoverable when importing the repository. It builds
`math-practice/` and publishes `math-practice/dist/`. A matching app-local config
supports deployments where the project base has already been set manually.
The build runs on Node 24. `public/_redirects` is copied to `dist/_redirects`
and maps client routes to `index.html`.

The application itself does not require environment variables or secrets.
A Netlify deployment token is only needed if deploying from this cloud environment.
Never put it in the repository, a VITE_ variable, or a chat message.

## Connect the GitHub repository (recommended)

1. Sign in to Netlify and choose Add new project → Import an existing project.
2. Connect GitHub and select `tranpaul707/CSE_4095`.
3. Select the `main` production branch.
4. Confirm base `math-practice`, build `npm run build`, publish `dist`.
5. Deploy. Inspect the build log for an actual Vite build and a published index.html.

Future pushes to main will deploy automatically after the connection is established.
No Netlify token is needed by the app or by GitHub source code for this approach.

## Deploy from this cloud environment

The environment currently has no Netlify authentication and requests to
`api.netlify.com` and `app.netlify.com` receive a proxy 403. Requirements were saved
in the environment settings draft:

- Allowed destinations: `api.netlify.com`, `app.netlify.com`, `*.netlify.app`.
- Secure requirement: `NETLIFY_AUTH_TOKEN`, scoped to `api.netlify.com`.

To have the agent create/deploy the site, supply the Netlify token securely in
that environment setting, review/save the changes and publish the environment.
Saving a draft alone does not apply these settings or create a Netlify site.
The agent must then retry API access, identify the correct Netlify account/site,
deploy the verified dist output, and verify the resulting public URL.
For an existing site, provide its name or URL; do not paste credentials in chat.

## Public-site acceptance checks

These remain pending until there is a real public URL:

- Homepage and all five practice/settings/statistics routes load.
- Direct navigation and refresh on `/statistics` and `/practice/setup` work.
- Finish a five-question session with the final answer self-reported wrong.
- Verify summary totals and enabled mistake review; refresh and verify again.
- Practice related questions and verify mastery.
- Change settings and confirm they persist after reopening the browser.
- Test mobile/tablet layouts, console errors, audio, and keyboard interaction.

A successful local build or Netlify configuration file is not proof of public deployment.
