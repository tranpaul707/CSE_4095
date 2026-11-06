# Deploy to Render

This is a **Static Site**. Supabase already hosts the backend and database; no separate Node web service is needed.

1. In Render, select **New → Static Site**.
2. Connect GitHub and choose **tranpaul707/CSE_4095**.
3. Enter these settings:

| Setting | Value |
| --- | --- |
| Name | `classroom-survey` (or an available name) |
| Branch | `main` |
| Root Directory | `classroom-survey` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Auto deploy | On commit |

4. Under Environment, add:
   - `NODE_VERSION`: `24`
   - `VITE_SUPABASE_URL`: your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: your public publishable key (or legacy anon key)
5. Create the Static Site and wait for deployment to finish.
6. Under **Redirects/Rewrites**, add source `/*`, destination `/index.html`, action **Rewrite** (200). Save. Render does not use the included Cloudflare/Netlify `_redirects` file.
7. In Supabase **Authentication → URL Configuration**, set **Site URL** to your new Render HTTPS URL. This app uses password login; configuring the URL also prepares auth email links. Add exact redirect URLs if you later enable recovery or email-link flows.
8. Keep Supabase public signup disabled. Use your already-created instructor account.
9. Open the Render URL and confirm the demo banner is absent. Log in, create a survey, activate it, and refresh a nested page to test routing.
10. Scan the new QR code from a phone. Submit, check results, close, and verify new submissions are rejected. Old QR images link to the old host; generate/download fresh ones from Render.

## Blueprint option
Create a Render Blueprint from this repository and set **Blueprint Path** to `classroom-survey/render.yaml`. Supply both Supabase variables when prompted. The Blueprint declares the same root directory and rewrite. The YAML is intentionally inside the app folder to avoid affecting unrelated coursework.

## Troubleshooting
- Demo mode: the public Supabase build variables are missing. Add them and rebuild.
- Build cannot find package.json: set Root Directory to `classroom-survey`.
- Refreshing `/dashboard` returns 404: add the rewrite rule.
- Login fails: verify the Supabase project URL, public key, instructor credentials and confirmed user status.
- Never enter a service-role/secret key in a `VITE_` variable; frontend variables are public.

Deployment on Render and production verification are still pending. No Render service was created by preparing these files.
