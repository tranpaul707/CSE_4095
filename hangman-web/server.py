"""Flask transport for the independent Hangman engine."""

from threading import RLock
from uuid import uuid4

from flask import Flask, jsonify, request
from werkzeug.exceptions import BadRequest, HTTPException, UnsupportedMediaType

from game import GuessError, HangmanGame
from word_manager import WordManager


def create_app(word_manager=None):
    app = Flask(__name__, static_folder="static")
    app.config["MAX_CONTENT_LENGTH"] = 2048
    manager = word_manager if word_manager is not None else WordManager()
    games = {}
    lock = RLock()

    def read_body(required_field):
        if not request.is_json:
            raise UnsupportedMediaType("Use Content-Type: application/json.")
        body = request.get_json()
        if not isinstance(body, dict) or set(body) != {required_field}:
            raise BadRequest(f"Send a JSON object containing only '{required_field}'.")
        return body[required_field]

    def lookup(game_id):
        from werkzeug.exceptions import NotFound
        if game_id not in games:
            raise NotFound("Game not found. It may have expired after a server restart.")
        return games[game_id]

    def snapshot(game_id, record):
        difficulty, game = record
        return {"game_id": game_id, "difficulty": difficulty, **game.to_dict()}

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.post("/api/games")
    def create_game():
        difficulty = read_body("difficulty")
        try:
            word = manager.choose(difficulty)
        except ValueError as error:
            raise BadRequest(str(error)) from error
        game_id = str(uuid4())
        with lock:
            games[game_id] = (difficulty, HangmanGame(word))
            state = snapshot(game_id, games[game_id])
        response = jsonify(state)
        response.status_code = 201
        response.headers["Location"] = f"/api/games/{game_id}"
        return response

    @app.get("/api/games/<game_id>")
    def get_game(game_id):
        with lock:
            return jsonify(snapshot(game_id, lookup(game_id)))

    @app.post("/api/games/<game_id>/guess")
    def guess(game_id):
        letter = read_body("letter")
        with lock:
            record = lookup(game_id)
            try:
                record[1].guess(letter)
            except GuessError as error:
                status = 400 if error.code == "invalid_guess" else 409
                return jsonify(error={"code": error.code, "message": str(error)}), status
            return jsonify(snapshot(game_id, record))

    @app.errorhandler(HTTPException)
    def http_error(error):
        response = error.get_response()
        response.data = app.json.dumps({"error": {
            "code": error.name.lower().replace(" ", "_"),
            "message": error.description,
        }})
        response.content_type = "application/json"
        return response

    @app.after_request
    def response_headers(response):
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
