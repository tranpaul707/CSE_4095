# Hangman REST client

Install and run from this folder:

```bash
python3 -m pip install -r requirements.txt
python3 hangman_client.py --difficulty easy
```

The server URL defaults to `https://hangman-ex89.onrender.com`; set `HANGMAN_BASE_URL` to use another deployment. The client starts a server game, sends each letter as a POST request, and uses the server's status to decide when the game ends. Enter `q!` to leave the terminal client.

The assignment excerpt does not document endpoint paths or response field names. This client assumes `POST /api/games`, `GET /api/games/{id}`, and `POST /api/games/{id}/guesses`, with `id`, `word_pattern`, `remaining_attempts`, and `status` in the response. `HANGMAN_GAMES_PATH` and `HANGMAN_GUESSES_PATH` can change the paths if the server uses different routes. Confirm these against the server's API documentation before submission.
