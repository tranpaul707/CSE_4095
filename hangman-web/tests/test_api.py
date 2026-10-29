import unittest

from server import create_app


class FixedWords:
    def choose(self, difficulty):
        if not isinstance(difficulty, str) or difficulty not in ("easy", "medium", "hard"):
            raise ValueError("Difficulty must be easy, medium, or hard.")
        return "apple"


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(FixedWords())
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def start(self, difficulty="easy"):
        response = self.client.post("/api/games", json={"difficulty": difficulty})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.headers["Location"], f"/api/games/{response.json['game_id']}")
        return response.json

    def guess(self, game_id, letter):
        return self.client.post(f"/api/games/{game_id}/guess", json={"letter": letter})

    def test_create_all_difficulties_and_get(self):
        ids = set()
        for difficulty in ("easy", "medium", "hard"):
            state = self.start(difficulty)
            ids.add(state["game_id"])
            self.assertEqual(state["difficulty"], difficulty)
            self.assertNotIn("word", state)
            response = self.client.get(f"/api/games/{state['game_id']}")
            self.assertEqual(response.json, state)
            self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertEqual(len(ids), 3)

    def test_games_are_independent(self):
        first, second = self.start(), self.start()
        self.guess(first["game_id"], "p")
        self.assertEqual(self.client.get(f"/api/games/{second['game_id']}").json, second)
        self.assertEqual(self.client.get(f"/api/games/{first['game_id']}").json["pattern"], "_ p p _ _")

    def test_complete_win_and_new_game(self):
        game_id = self.start()["game_id"]
        for letter in "apl":
            response = self.guess(game_id, letter)
            self.assertEqual(response.status_code, 200)
            self.assertNotIn("word", response.json)
        response = self.guess(game_id, "e")
        self.assertEqual(response.json["status"], "won")
        self.assertEqual(response.json["word"], "apple")
        self.assertEqual(self.guess(game_id, "z").status_code, 409)
        self.assertNotEqual(self.start()["game_id"], game_id)

    def test_complete_loss_and_reject_later_guess(self):
        game_id = self.start()["game_id"]
        for i, letter in enumerate("bcdfgh"):
            response = self.guess(game_id, letter)
            self.assertEqual(response.json["remaining_guesses"], 5 - i)
            if i < 5:
                self.assertNotIn("word", response.json)
        self.assertEqual(response.json["status"], "lost")
        self.assertEqual(response.json["word"], "apple")
        self.assertEqual(self.guess(game_id, "a").status_code, 409)

    def test_duplicate_and_invalid_guesses_do_not_mutate(self):
        game_id = self.start()["game_id"]
        before = self.guess(game_id, "a").json
        response = self.guess(game_id, "A")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json["error"]["code"], "duplicate_guess")
        for letter in (None, True, 2, "ab", "é", "", {}, []):
            with self.subTest(letter=letter):
                response = self.guess(game_id, letter)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(self.client.get(f"/api/games/{game_id}").json, before)

    def test_invalid_create_bodies(self):
        for body in ({}, [], None, "easy", {"difficulty": []}, {"difficulty": "extreme"},
                     {"difficulty": "easy", "word": "apple"}):
            with self.subTest(body=body):
                response = self.client.post("/api/games", data=self.app.json.dumps(body),
                                            content_type="application/json")
                self.assertEqual(response.status_code, 400)
                self.assertIn("error", response.json)

    def test_invalid_guess_bodies(self):
        game_id = self.start()["game_id"]
        for body in ({}, [], {"letter": "a", "word": "apple"}):
            response = self.client.post(f"/api/games/{game_id}/guess", json=body)
            self.assertEqual(response.status_code, 400)

    def test_non_json_and_malformed_requests(self):
        self.assertEqual(self.client.post("/api/games", data="hello").status_code, 415)
        response = self.client.post("/api/games", data="{bad", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json)

    def test_missing_games_routes_and_method_errors_are_json(self):
        responses = [self.client.get("/api/games/missing"),
                     self.guess("missing", "a"), self.client.get("/api/unknown"),
                     self.client.get("/api/games")]
        self.assertEqual([r.status_code for r in responses], [404, 404, 404, 405])
        for response in responses:
            self.assertIn("error", response.json)

    def test_oversized_requests(self):
        response = self.client.post("/api/games", json={"difficulty": "a" * 3000})
        self.assertEqual(response.status_code, 413)
        self.assertIn("error", response.json)

    def test_frontend_assets_and_word_lists_are_not_served(self):
        with self.client.get("/") as response:
            self.assertEqual(response.status_code, 200)
            self.assertIn(b"Hangman", response.data)
        for path in ("/static/app.js", "/static/style.css"):
            with self.client.get(path) as response:
                self.assertEqual(response.status_code, 200)
        for path in ("/words/easy.txt", "/static/../words/easy.txt", "/game.py"):
            self.assertEqual(self.client.get(path).status_code, 404)
