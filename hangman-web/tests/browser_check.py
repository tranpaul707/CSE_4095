"""Optional real-browser checks. Own local server; no deployed games are changed.

Run: python tests/browser_check.py
For system Chromium: python tests/browser_check.py --browser /usr/bin/chromium
"""
import argparse
from pathlib import Path
import sys
from threading import Thread

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from playwright.sync_api import expect, sync_playwright
from werkzeug.serving import make_server
from server import create_app


WORDS = {"easy": "apple", "medium": "lantern", "hard": "xylophone"}


class TestWords:
    def choose(self, difficulty):
        return WORDS[difficulty]


def run(browser_path=None, screenshots=None):
    server = make_server("127.0.0.1", 0, create_app(TestWords()), threaded=True)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=browser_path, headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 1000})
            errors, states, requests = [], [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("request", lambda request: requests.append(request.url) if request.url.endswith("/guess") else None)

            def inspect_response(response):
                if "/api/games" in response.url and response.ok:
                    state = response.json()
                    states.append(state)
                    if state.get("status") == "playing":
                        assert "word" not in state, "Active answer exposed to browser"
                        assert set(state) == {"game_id", "difficulty", "pattern", "guessed_letters",
                                              "incorrect_letters", "remaining_guesses",
                                              "max_incorrect_guesses", "status"}
            page.on("response", inspect_response)
            page.goto(f"http://127.0.0.1:{server.server_port}")
            expect(page.locator(".letter-key:enabled")).to_have_count(0)

            def start(difficulty="easy"):
                page.locator(f'label:has(input[value="{difficulty}"])').click()
                page.locator("#new-game").click()
                expect(page.locator("#status")).to_have_text("A new word, a fresh start.")
                expect(page.locator("#new-game")).to_be_enabled()
                expect(page.locator("#difficulty-badge")).to_have_text(difficulty.title())
                expect(page.locator("#remaining")).to_have_text("6")

            def guess(letter, count, keyboard=False):
                if keyboard:
                    page.keyboard.press(letter.upper())
                else:
                    page.locator(f'[data-letter="{letter}"]').click()
                expect(page.locator(".guess-chip")).to_have_count(count)
                expect(page.locator("#new-game")).to_be_enabled()

            # Complete a win at every difficulty, mixing click and physical keyboard.
            for difficulty, word in WORDS.items():
                start(difficulty)
                for count, letter in enumerate(dict.fromkeys(word), 1):
                    guess(letter, count, keyboard=count % 2 == 0)
                    expect(page.locator(f'[data-letter="{letter}"]')).to_be_disabled()
                expect(page.locator("#status")).to_have_text("Nicely done. You found it!")
                expect(page.locator("#message")).to_contain_text(word.upper())
                expect(page.locator(".letter-key:enabled")).to_have_count(0)
            print("PASS: three difficulties, full wins, clicks, keyboard, active API secrecy")

            # Every incorrect guess reveals one more part of the drawing.
            start()
            for count, letter in enumerate("bcdfgh", 1):
                guess(letter, count)
                expect(page.locator("[data-part]:not([hidden])")).to_have_count(count)
                expect(page.locator("#remaining")).to_have_text(str(6 - count))
            expect(page.locator("#status")).to_have_text("Out of chances. Next word?")
            expect(page.locator("#message")).to_contain_text("APPLE")
            expect(page.locator(".letter-key:enabled")).to_have_count(0)
            start()
            expect(page.locator("[data-part]:not([hidden])")).to_have_count(0)
            expect(page.locator(".guess-chip")).to_have_count(0)
            print("PASS: full loss, six drawing stages, restart without reloading")

            # Duplicate input in the same event turn must send only one guess.
            before = len(requests)
            page.evaluate("""() => {
                document.body.dispatchEvent(new KeyboardEvent('keydown', {key:'a', bubbles:true}));
                document.body.dispatchEvent(new KeyboardEvent('keydown', {key:'a', bubbles:true}));
            }""")
            expect(page.locator(".guess-chip")).to_have_count(1)
            expect(page.locator("#new-game")).to_be_enabled()
            assert len(requests) == before + 1
            page.keyboard.press("a")
            page.keyboard.press("1")
            assert len(requests) == before + 1

            # Drop a response after the server accepted the guess; GET must recover it.
            def lose_response(route):
                route.fetch()
                route.abort()
            page.route("**/guess", lose_response)
            page.locator('[data-letter="z"]').click()
            expect(page.locator("#error")).to_be_visible()
            expect(page.locator(".guess-chip")).to_have_count(2)
            expect(page.locator("#remaining")).to_have_text("5")
            expect(page.locator("#new-game")).to_be_enabled()
            page.unroute("**/guess")
            print("PASS: duplicate input blocked, lost-response recovery and error display")

            # Expired game: clear stale controls and allow a new game.
            page.route("**/api/games/**", lambda route: route.fulfill(status=404,
                       content_type="application/json", body='{"error":{"message":"Game not found."}}'))
            page.locator('[data-letter="b"]').click()
            expect(page.locator("#status")).to_have_text("Your next word awaits.")
            expect(page.locator(".letter-key:enabled")).to_have_count(0)
            page.unroute("**/api/games/**")
            start("hard")
            expect(page.locator("#error")).to_be_hidden()

            if screenshots:
                screenshots.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(screenshots / "desktop.png"), full_page=True)
            for width in (390, 320):
                page.set_viewport_size({"width": width, "height": 844})
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Overflow at {width}px"
                clipped = page.evaluate("""() => {
                    const panel = document.querySelector('.game').getBoundingClientRect();
                    return [...document.querySelectorAll('#new-game, #keyboard, #status, #pattern, .letter-key, #difficulty-controls, .chances')]
                        .filter(el => { const r = el.getBoundingClientRect();
                            return r.left < panel.left || r.right > panel.right; })
                        .map(el => el.id || el.className);
                }""")
                assert not clipped, f"Clipped controls at {width}px: {clipped}"
                if screenshots:
                    page.screenshot(path=str(screenshots / f"mobile-{width}.png"), full_page=True)
            guess("x", 1)
            assert not errors, errors
            assert states, "No actual API responses observed"
            print("PASS: expired-game recovery, 390/320px layout, mobile input, no JS exceptions")
            browser.close()
    finally:
        server.shutdown()
        thread.join(timeout=5)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", help="Optional Chromium executable path")
    parser.add_argument("--screenshots", type=Path, help="Optional directory for screenshots")
    args = parser.parse_args()
    run(args.browser, args.screenshots)
