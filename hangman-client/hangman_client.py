"""Terminal client for the deployed Hangman REST API."""

import argparse
import os
import sys

import requests


BASE_URL = os.environ.get("HANGMAN_BASE_URL", "https://hangman-ex89.onrender.com").rstrip("/")
GAMES_PATH = os.environ.get("HANGMAN_GAMES_PATH", "/api/games").rstrip("/")
GUESSES_PATH = os.environ.get("HANGMAN_GUESSES_PATH", "guesses").strip("/")


class APIError(Exception):
    pass


def request_json(method, path, **kwargs):
    try:
        response = requests.request(method, f"{BASE_URL}{path}", timeout=20, **kwargs)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise APIError(f"Server request failed: {exc}") from exc
    if not isinstance(data, dict):
        raise APIError("Invalid server response: expected a JSON object")
    return data


def create_game(difficulty):
    return request_json("POST", GAMES_PATH, json={"difficulty": difficulty})


def get_game(game_id):
    return request_json("GET", f"{GAMES_PATH}/{game_id}")


def make_guess(game_id, letter):
    return request_json("POST", f"{GAMES_PATH}/{game_id}/{GUESSES_PATH}", json={"letter": letter})


def game_state(data):
    """Validate the fields needed to play; never calculate game status locally."""
    if isinstance(data.get("game"), dict):
        data = data["game"]
    game_id = data.get("id", data.get("game_id"))
    pattern = data.get("word_pattern", data.get("pattern", data.get("display_word")))
    remaining = data.get("remaining_attempts", data.get("attempts_left"))
    status = data.get("status")
    if not isinstance(game_id, (str, int)) or not isinstance(pattern, str):
        raise APIError("Invalid server response: missing game ID or word pattern")
    if not isinstance(remaining, int) or isinstance(remaining, bool) or remaining < 0:
        raise APIError("Invalid server response: missing remaining attempts")
    if not isinstance(status, str):
        raise APIError("Invalid server response: missing game status")
    return str(game_id), pattern, remaining, status.lower()


def show(data):
    game_id, pattern, remaining, status = game_state(data)
    print(f"Word: {pattern} | Attempts remaining: {remaining} | Status: {status}")
    return game_id, status


def main():
    parser = argparse.ArgumentParser(description="Play Hangman against the deployed server")
    parser.add_argument("--difficulty", default="easy", help="Server difficulty (default: easy)")
    args = parser.parse_args()
    try:
        data = create_game(args.difficulty)
        game_id, status = show(data)
        while status not in {"won", "lost", "win", "lose"}:
            try:
                letter = input("Guess a letter (or q! to quit): ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print("\nGame stopped.")
                return 0
            if letter == "q!":
                print("Game stopped.")
                return 0
            if len(letter) != 1 or not letter.isalpha() or not letter.isascii():
                print("Enter one letter from A to Z.")
                continue
            data = make_guess(game_id, letter)
            returned_id, status = show(data)
            if returned_id != game_id:
                raise APIError("Invalid server response: game ID changed")
        print("You won!" if status in {"won", "win"} else "Game over: you lost.")
        return 0
    except APIError as exc:
        print(exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
