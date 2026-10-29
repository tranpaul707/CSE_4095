"""Hangman rules, independent of Flask and any user interface."""

import re


class GuessError(ValueError):
    """A rejected guess; callers can use code to choose an HTTP status."""

    def __init__(self, message, code="invalid_guess"):
        super().__init__(message)
        self.code = code


class HangmanGame:
    MAX_INCORRECT = 6

    def __init__(self, word):
        if not isinstance(word, str) or not re.fullmatch(r"[a-zA-Z]+", word):
            raise ValueError("Words must contain only English letters.")
        self._word = word.lower()
        self._guesses = []

    @property
    def incorrect_letters(self):
        return [letter for letter in self._guesses if letter not in self._word]

    @property
    def remaining_guesses(self):
        return self.MAX_INCORRECT - len(self.incorrect_letters)

    @property
    def status(self):
        if all(letter in self._guesses for letter in self._word):
            return "won"
        if self.remaining_guesses == 0:
            return "lost"
        return "playing"

    def guess(self, letter):
        if self.status != "playing":
            raise GuessError("This game has ended. Start a new game.", "game_finished")
        if not isinstance(letter, str) or not re.fullmatch(r"[a-zA-Z]", letter):
            raise GuessError("Guess one English letter (A–Z).")
        letter = letter.lower()
        if letter in self._guesses:
            raise GuessError("That letter has already been guessed.", "duplicate_guess")
        self._guesses.append(letter)
        return self.to_dict()

    def to_dict(self):
        """Return a fresh, client-safe snapshot; never expose an active answer."""
        state = {
            "pattern": " ".join(c if c in self._guesses else "_" for c in self._word),
            "guessed_letters": list(self._guesses),
            "incorrect_letters": self.incorrect_letters,
            "remaining_guesses": self.remaining_guesses,
            "max_incorrect_guesses": self.MAX_INCORRECT,
            "status": self.status,
        }
        if self.status != "playing":
            state["word"] = self._word
        return state
