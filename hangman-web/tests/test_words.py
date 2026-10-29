from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from word_manager import DIFFICULTIES, WordManager


class WordTests(unittest.TestCase):
    def test_all_difficulties_load_and_select(self):
        manager = WordManager()
        for difficulty in DIFFICULTIES:
            with self.subTest(difficulty=difficulty):
                self.assertRegex(manager.choose(difficulty), r"^[a-z]+$")

    def test_invalid_difficulty(self):
        manager = WordManager()
        for difficulty in (None, [], {}, 1, "extreme", "Easy"):
            with self.assertRaises(ValueError):
                manager.choose(difficulty)

    def test_normalization_deduplication_and_random_selection(self):
        with TemporaryDirectory() as directory:
            for difficulty in DIFFICULTIES:
                (Path(directory) / f"{difficulty}.txt").write_text("Apple\napple\n\n banana \n")
            manager = WordManager(directory)
            with patch("word_manager.random.choice", return_value="banana") as choose:
                self.assertEqual(manager.choose("easy"), "banana")
                choose.assert_called_once_with(("apple", "banana"))

    def test_empty_and_invalid_lists_fail_early(self):
        for contents in ("\n", "valid\nbad-word\n", "café\n"):
            with self.subTest(contents=contents), TemporaryDirectory() as directory:
                (Path(directory) / "easy.txt").write_text(contents)
                with self.assertRaises(ValueError):
                    WordManager(directory)

    def test_missing_list_fails_early(self):
        with TemporaryDirectory() as directory:
            with self.assertRaises(FileNotFoundError):
                WordManager(directory)
