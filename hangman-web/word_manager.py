"""Load local word lists and select a random word for a requested difficulty."""

from pathlib import Path
import random
import re

DIFFICULTIES = ("easy", "medium", "hard")


class WordManager:
    def __init__(self, directory=None):
        directory = Path(directory) if directory else Path(__file__).parent / "words"
        self._words = {}
        for difficulty in DIFFICULTIES:
            words = []
            for line in (directory / f"{difficulty}.txt").read_text(encoding="utf-8").splitlines():
                word = line.strip().lower()
                if not word:
                    continue
                if not re.fullmatch(r"[a-z]+", word):
                    raise ValueError(f"Invalid word in {difficulty}.txt: English letters only.")
                if word not in words:
                    words.append(word)
            if not words:
                raise ValueError(f"The {difficulty} word list is empty.")
            self._words[difficulty] = tuple(words)

    def choose(self, difficulty):
        if not isinstance(difficulty, str) or difficulty not in DIFFICULTIES:
            raise ValueError("Difficulty must be easy, medium, or hard.")
        return random.choice(self._words[difficulty])
