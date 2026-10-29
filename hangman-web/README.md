# Hangman — The Word Corner

A web-based Hangman game for CSE 4095. Python owns the game rules; Flask exposes
a JSON REST API; HTML/CSS/JavaScript renders the game and sends guesses with fetch.

## Run locally

Python 3.11+ recommended. From the CSE_4095 repository:

```sh
cd hangman-web
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python server.py
```

Open **http://127.0.0.1:5000**. Stop with Ctrl+C. On Windows PowerShell, create the
environment with `py -m venv .venv` and activate with `.venv\Scripts\Activate.ps1`.
Use `python` for the subsequent commands.

## Tests

With the virtual environment activated:

```sh
python -m unittest discover -s tests -v
```

26 tests cover the engine, word loading, API, separate games, input errors, full
wins/losses, and secrecy. See [docs/TESTING.md](docs/TESTING.md) for optional real
browser automation and the required manual Chrome Developer Tools walkthrough.

## How it works

1. JavaScript POSTs a difficulty to `/api/games`.
2. Flask picks a random word from the selected server-side list and stores a game
   under a unique UUID.
3. Each guessed letter is POSTed to that game's `/guess` route.
4. The independent `HangmanGame` engine validates it and changes server state.
5. Flask returns a safe JSON snapshot; JavaScript renders the pattern, previous
   guesses, chances, drawing, and outcome.

All levels allow six incorrect guesses. Easy words are familiar and generally
short; Medium words are longer or moderately challenging; Hard includes unusual
spellings and vocabulary. Difficulty is a curated list, not a guaranteed word
length. A correct guess reveals every occurrence without losing a chance.
Guesses accept one A–Z letter, case-insensitively. Invalid/duplicate guesses do
not change the game. Ended games reject further guesses. A new game needs no
page reload. Difficulty selection applies to the next game.

The browser never receives the answer while status is `playing`. It contains
no word lists or independent rule engine. Terminal responses include `word`.

## API

All POST bodies must be JSON objects with exactly the listed field.

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/games` | `{"difficulty":"easy"}` | 201, initial state |
| GET | `/api/games/{game_id}` | none | 200, current state |
| POST | `/api/games/{game_id}/guess` | `{"letter":"e"}` | 200, updated state |

State fields: `game_id`, `difficulty`, `pattern` (space-separated slots),
`guessed_letters`, `incorrect_letters`, `remaining_guesses`,
`max_incorrect_guesses`, and `status` (`playing`, `won`, `lost`). Only completed
games include `word`. API responses are not cached.

Errors use `{"error":{"code":"...","message":"..."}}`: 400 invalid input or
malformed JSON, 404 missing game, 405 unsupported method, 409 duplicate or ended
game, 413 oversized request, 415 non-JSON body. `Location` on a 201 response
identifies the created resource.

Example (server running):

```sh
curl -i -X POST http://127.0.0.1:5000/api/games \
  -H 'Content-Type: application/json' -d '{"difficulty":"easy"}'
```

Copy the returned game_id into the next request:

```sh
curl -X POST http://127.0.0.1:5000/api/games/GAME_ID/guess \
  -H 'Content-Type: application/json' -d '{"letter":"e"}'
```

## Files

- `game.py`: rules and client-safe serialization, independent of Flask.
- `word_manager.py`, `words/`: validated difficulty lists and random selection.
- `server.py`: Flask app factory, API, in-memory games, static frontend.
- `static/`: interface, styling, SVG drawing, and fetch interactions.
- `tests/`: deterministic engine/API tests and optional browser checks.
- `SPECIFICATION.md`: unchanged original specification.
- `TODO.md`: assignment-specific phases and actual completion status.
- `docs/`: assignment, original TODO, testing, deployment, submission guidance.
- `DEVELOPMENT.md`: factual implementation and verification record.

## Deployment and submission

Use [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Render setup, including the
**hangman-web root directory** required by this repository. `render.yaml` is an
optional Blueprint configuration. Production uses Gunicorn with exactly one
worker because games are stored in process memory.

Deployment status: the student reports deployment at
https://paul-hangman.onrender.com/. Independent live verification is pending: the
agent environment blocks outbound access to this Render host, and the web-reading
tool could not access it. Local tests passed; they do not establish live behavior. See [docs/SUBMISSION.md](docs/SUBMISSION.md)
for report and recording guidance.

## Scope and limitations

The assignment takes precedence over the larger original specification. Terminal
clients, bots, evaluation, leaderboards, logging/replay utilities, and optional
extensions are excluded. Original source was written for this app.

Games are held in memory: server restart or hosting sleep loses them. Use one
Gunicorn worker and one instance. The browser handles a missing game by allowing
a fresh start. Refreshing the page also starts a new browser session. Games are
not automatically pruned, so this implementation suits a small class demo rather
than a long-lived high-traffic service. UUIDs provide separate game resources,
not authentication. Hosting free-tier availability and limits can change.
