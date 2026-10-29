# Deploy the Flask app to Render

This is a Python web service, so static hosting alone (GitHub Pages or a static
Netlify site) cannot run its Flask API.

## Prepare GitHub

Phase commits are made in the existing CSE_4095 repository. The prepared app
branch is `hangman-web-app` if the push succeeds; confirm in GitHub before
selecting a deployment branch. Do not deploy an older main branch that lacks
the hangman-web folder. Do not create a nested Git repository inside the app.

If an agent push was unavailable, from CSE_4095 run:

```sh
git push origin HEAD:refs/heads/hangman-web-app
```

Inspect GitHub and confirm `hangman-web/server.py`, `static/`, `words/`, and
`requirements.txt` are present on the chosen branch.

## Create a Render Web Service

Sign in to your Render account and connect the GitHub repository. Choose
**New → Web Service** and select `tranpaul707/CSE_4095`.

| Setting | Value |
| --- | --- |
| Branch | `hangman-web-app` (or the branch containing this app) |
| Root Directory | `hangman-web` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn --bind 0.0.0.0:$PORT --workers 1 server:app` |
| Environment variable | `PYTHON_VERSION=3.12.14` |
| Health Check Path | `/` |
| Instance count | 1 |

Choose a suitable plan; if a free option is offered, it can be used for the
assignment. Review any charge in your account before choosing a paid plan.
No application credentials or API keys are required.

Alternatively, create a Blueprint using `hangman-web/render.yaml` on the correct
branch; its rootDir is relative to the repository root. If the Blueprint UI does
not support a nested YAML path, use the manual Web Service settings above.
Do not change the repository's existing root netlify.toml or other applications.

## Verify after deployment

1. Open the generated public HTTPS URL; allow time for an initial cold start.
2. Start a game, inspect POST `/api/games` and its 201 JSON response in Chrome.
3. Play until a win or loss, verifying guesses and the changing drawing.
4. Inspect a guess response: active games omit `word`; ended games reveal it.
5. Start another game without reloading. Try all three difficulty levels.
6. Reload the public URL from another browser/private window to confirm it works
   independently of your local computer. Keep the service available for grading.
7. Record the verified URL and date in the development record and your report.

## Production smoke test locally (macOS/Linux)

With the virtual environment active and from hangman-web:

```sh
gunicorn --bind 127.0.0.1:5050 --workers 1 server:app
```

Open http://127.0.0.1:5050. Stop with Ctrl+C. Gunicorn is a Unix production server;
on Windows use the Flask local command for testing and deploy Gunicorn on Render.

## Troubleshooting

- `ModuleNotFoundError: server`: check Root Directory is `hangman-web`.
- Missing game after restart: expected with in-memory storage; start a new game.
- Games disappear between requests: use exactly one worker and one instance.
- Slow first request: free hosting can sleep. The frontend waits up to 65 seconds
  before reporting a connection error.
- Existing Netlify link loads another app: this Flask app needs its own service;
  the existing site's deployment is unrelated.
