# Development report draft — Web-Based Hangman

**Draft: deployment, student manual checks, and personal reflection are pending.**
Revise in your own words and export the finished version as a 1–2 page PDF.

## Development process

I used ChatGPT's Codex coding agent to develop a Hangman web application using
Python, Flask, HTML, CSS, and JavaScript. The assignment instructions controlled
the scope; the larger reference specification, original TODO, and instructor
transcript supplied context. The revised TODO excluded terminal clients, bots,
evaluation, leaderboards, and replay. Work proceeded through planning, the engine
and word management, the REST API, the browser interface, testing, and deployment
preparation, with verification and separate Git commits for each phase.

Representative prompts from the actual conversation:

1. “In this case, stick to the assignment details if the reference files are
   asking more than what we need”
2. “Display the phases you'll stat working on, also, create a separate folder
   in CSE_4095 to store our app”
3. “Begin working through the phases, let me know if there is any intervention,
   when it comes to testing, let me know what commands I need to run”

## Implementation

The Python HangmanGame class is independent of Flask. It tracks guesses, reveals
matching positions, allows six incorrect guesses, and detects wins and losses.
A WordManager loads and validates three difficulty-specific word lists and picks
random words. Flask stores each game under a unique ID and implements POST
/api/games, GET /api/games/{id}, and POST /api/games/{id}/guess. Requests are
validated, and invalid or repeated guesses do not change the game.

The browser uses fetch to send guesses and renders the server's JSON response.
It displays the pattern, chances, previous letters, and a six-stage SVG drawing.
The server owns the answer and rules; active responses omit the hidden word.
The interface supports letter buttons, physical keyboard input, and new games
without reloading.

## Testing

The agent ran 26 automated engine, word-list, and Flask API tests successfully.
Real Chromium checks covered all difficulties, complete wins and losses, drawing
updates, keyboard/click input, restarting, active response secrecy, request
recovery, and narrow mobile layouts. The production Gunicorn server also passed
HTTP checks for complete games at all three difficulties.

**Add your own checks:** describe games you played locally and what you observed
in Chrome Developer Tools. Explain one fetch request, Flask processing, JSON
response, and resulting page update. Record the commands you actually ran.

## Deployment

Render configuration uses root directory hangman-web, pip installation of
requirements.txt, and `gunicorn --bind 0.0.0.0:$PORT --workers 1 server:app`.
A single worker is necessary because games are stored in process memory.

**Complete after deployment:** public URL, deployment branch/date, actual hosting
settings, and results of playing a complete game at the live HTTPS URL. Do not
state that the site is deployed until it has been verified.

## Challenge and resolution

A 320-pixel screenshot revealed controls clipped inside the game panel, even
though the document did not scroll horizontally. Grid tracks retained their
minimum content width and the panel hid the overflow. The fix allowed tracks
to shrink and stacked setup controls on very narrow screens. Browser checks
were strengthened to test control boundaries, and the updated layout passed.

## Personal reflection

**Write this yourself after reviewing and running the app:** What did you learn
about guiding an AI agent, verifying generated code, and the browser/server
boundary? Which part can you now explain that was unfamiliar before? What would
you change in your next AI-assisted project?
