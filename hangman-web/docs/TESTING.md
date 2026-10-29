# Running and understanding the tests

Open a terminal in CSE_4095/hangman-web. Python 3.11+ is recommended.

## First-time setup (macOS/Linux)
```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Windows PowerShell: use `py -m venv .venv`, then
`.venv\Scripts\Activate.ps1`. Subsequent `python` commands are the same.

## Engine, word-list, and Flask API tests
```sh
python -m unittest discover -s tests -v
```
These tests need no running server and make no external requests. They cover
all difficulties, correct/incorrect/duplicate/invalid guesses, win/loss and ended
games, isolation, request errors, and hidden-word disclosure. API tests inject
a known word server-side; the production API never accepts a supplied answer.

## Optional automated browser tests
```sh
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/browser_check.py
```
Linux may require `python -m playwright install --with-deps chromium` to install
browser system dependencies. If Chromium is already installed, use
`python tests/browser_check.py --browser /usr/bin/chromium`.
This script starts its own local server with deterministic test-only words,
plays wins and losses, checks the SVG, mobile layouts, keyboard input, restarts,
request recovery, and active API response secrecy. It never changes live games.

## Play locally and inspect a request (required student check)
```sh
python server.py
```
Open http://127.0.0.1:5000 in Chrome. Keep the terminal open. Stop with Ctrl+C.

1. Open Developer Tools → Network, select Fetch/XHR, then start an Easy game.
2. Select the `games` request: POST `/api/games`, body `{"difficulty":"easy"}`,
   response status 201, JSON containing a game_id and masked pattern.
3. Guess a letter and select its `guess` request. Inspect the Payload:
   `{"letter":"e"}`. Inspect the JSON Response and verify the pattern,
   guessed_letters, incorrect_letters, remaining_guesses, and status match the UI.
4. While status is `playing`, confirm there is no `word` or answer field.
5. Explain: JavaScript fetch → Flask route → Python engine → JSON → DOM update.
6. Play through a win or loss. Confirm the answer appears only at the end, the
   keyboard disables, and New game resets the UI without reloading the page.
7. Try Medium and Hard. Try uppercase keyboard input and repeated letters.
8. Use a narrow browser window and verify controls are readable and usable.
9. With DevTools set to Offline, try a guess, return to Online, and retry. The
   error should be visible and the page should recover when the server responds.

Optional syntax check if Node.js is installed: `node --check static/app.js`.
