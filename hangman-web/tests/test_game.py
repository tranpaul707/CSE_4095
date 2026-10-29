import unittest

from game import GuessError, HangmanGame


class GameTests(unittest.TestCase):
    def test_initial_state_and_no_answer(self):
        state = HangmanGame("apple").to_dict()
        self.assertEqual(state["pattern"], "_ _ _ _ _")
        self.assertEqual(state["remaining_guesses"], 6)
        self.assertEqual(state["status"], "playing")
        self.assertNotIn("word", state)

    def test_correct_guess_reveals_all_occurrences(self):
        state = HangmanGame("apple").guess("P")
        self.assertEqual(state["pattern"], "_ p p _ _")
        self.assertEqual(state["guessed_letters"], ["p"])
        self.assertEqual(state["remaining_guesses"], 6)
        self.assertNotIn("word", state)

    def test_incorrect_guess_costs_one_life(self):
        state = HangmanGame("apple").guess("z")
        self.assertEqual(state["incorrect_letters"], ["z"])
        self.assertEqual(state["remaining_guesses"], 5)

    def test_duplicate_does_not_change_game(self):
        for letter in ("a", "z"):
            game = HangmanGame("apple")
            game.guess(letter)
            before = game.to_dict()
            with self.assertRaises(GuessError) as error:
                game.guess(letter.upper())
            self.assertEqual(error.exception.code, "duplicate_guess")
            self.assertEqual(game.to_dict(), before)

    def test_invalid_guesses_do_not_change_game(self):
        for letter in (None, 1, True, [], {}, "", "ab", "1", "é", " ", " a"):
            with self.subTest(letter=letter):
                game = HangmanGame("apple")
                before = game.to_dict()
                with self.assertRaises(GuessError):
                    game.guess(letter)
                self.assertEqual(game.to_dict(), before)

    def test_win_and_reveal(self):
        game = HangmanGame("apple")
        for letter in "aple":
            game.guess(letter)
        self.assertEqual(game.status, "won")
        self.assertEqual(game.to_dict()["word"], "apple")
        self.assertEqual(game.to_dict()["pattern"], "a p p l e")

    def test_loss_and_reveal(self):
        game = HangmanGame("apple")
        for letter in "bcdfgh":
            game.guess(letter)
        self.assertEqual(game.status, "lost")
        self.assertEqual(game.remaining_guesses, 0)
        self.assertEqual(game.to_dict()["word"], "apple")

    def test_guess_after_either_end_is_rejected(self):
        for guesses in ("aple", "bcdfgh"):
            game = HangmanGame("apple")
            for letter in guesses:
                game.guess(letter)
            before = game.to_dict()
            with self.assertRaises(GuessError) as error:
                game.guess("x")
            self.assertEqual(error.exception.code, "game_finished")
            self.assertEqual(game.to_dict(), before)

    def test_snapshot_cannot_mutate_game(self):
        game = HangmanGame("apple")
        state = game.to_dict()
        state["guessed_letters"].append("a")
        self.assertEqual(game.to_dict()["guessed_letters"], [])

    def test_invalid_words(self):
        for word in ("", None, "two words", "café", 42):
            with self.assertRaises(ValueError):
                HangmanGame(word)
