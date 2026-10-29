/* Presentation and HTTP only: Flask owns the word and all game decisions. */
"use strict";

const el = (id) => document.getElementById(id);
const alphabet = "abcdefghijklmnopqrstuvwxyz";
const keys = new Map();
let game = null;
let busy = false;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function api(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(65000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("The server returned an unexpected response. Please try again.", response.status);
  }
  if (!response.ok) {
    throw new ApiError(data.error?.message || "The request failed. Please try again.", response.status);
  }
  return data;
}

function showError(message = "") {
  el("error").textContent = message;
  el("error").hidden = !message;
}

function render() {
  const playing = game?.status === "playing";
  const guessed = game?.guessed_letters || [];
  const incorrect = game?.incorrect_letters || [];
  el("new-game").disabled = busy;
  el("new-game").textContent = busy ? "Please wait…" : game ? "New game" : "Start game";
  el("difficulty-controls").disabled = busy;
  document.querySelector(".game").dataset.status = game?.status || "ready";
  el("difficulty-badge").textContent = game ? `${game.difficulty[0].toUpperCase()}${game.difficulty.slice(1)}` : "Ready when you are";
  const remaining = game?.remaining_guesses ?? 6;
  el("remaining").textContent = remaining;
  el("chance-label").textContent = remaining === 1 ? "chance left" : "chances left";
  el("lives").replaceChildren(...Array.from({ length: 6 }, (_, i) => {
    const dot = document.createElement("span");
    dot.className = `life${i >= remaining ? " used" : ""}`;
    return dot;
  }));
  document.querySelectorAll("[data-part]").forEach((part, i) => {
    // SVG uses attributes rather than the HTMLElement hidden property.
    part.toggleAttribute("hidden", i >= incorrect.length);
  });
  for (const [letter, button] of keys) {
    const tried = guessed.includes(letter);
    button.disabled = busy || !playing || tried;
    button.className = `letter-key${tried ? incorrect.includes(letter) ? " incorrect" : " correct" : ""}`;
    button.setAttribute("aria-label", `${letter.toUpperCase()}${tried ? incorrect.includes(letter) ? ", incorrect" : ", correct" : ""}`);
  }
  if (!game) {
    el("status").textContent = "Your next word awaits.";
    el("message").textContent = "Choose a difficulty and start a game.";
    el("pattern").replaceChildren();
    const prompt = document.createElement("span");
    prompt.className = "empty-word";
    prompt.textContent = "? ? ? ? ?";
    prompt.setAttribute("aria-hidden", "true");
    el("pattern").append(prompt);
    el("pattern").setAttribute("aria-label", "No game started");
  } else {
    const slots = game.pattern.split(" ");
    el("pattern").replaceChildren(...slots.map((letter) => {
      const slot = document.createElement("span");
      slot.className = "letter-slot";
      slot.textContent = letter === "_" ? "" : letter;
      slot.setAttribute("aria-hidden", "true");
      return slot;
    }));
    el("pattern").setAttribute("aria-label", `Word: ${slots.map((letter) => letter === "_" ? "blank" : letter).join(", ")}`);
    if (playing) {
      el("status").textContent = guessed.length ? `${remaining} ${remaining === 1 ? "chance" : "chances"} left. Keep going!` : "A new word, a fresh start.";
      el("message").textContent = `${slots.length} letters. Pick a letter below or use your keyboard.`;
    } else {
      el("status").textContent = game.status === "won" ? "Nicely done. You found it!" : "Out of chances. Next word?";
      el("message").textContent = `The word was ${game.word.toUpperCase()}. Start a new game to play again.`;
    }
  }
  el("guessed").replaceChildren();
  if (!guessed.length) el("guessed").textContent = "No letters yet.";
  for (const letter of guessed) {
    const chip = document.createElement("span");
    chip.className = `guess-chip${incorrect.includes(letter) ? " wrong" : ""}`;
    chip.textContent = letter.toUpperCase();
    chip.setAttribute("aria-label", `${letter.toUpperCase()}, ${incorrect.includes(letter) ? "incorrect" : "correct"}`);
    el("guessed").append(chip);
  }
}

async function startGame() {
  if (busy) return;
  busy = true;
  showError();
  render();
  try {
    game = await api("/api/games", { difficulty: document.querySelector('input[name="difficulty"]:checked').value });
  } catch (error) {
    showError(error.message);
  } finally {
    busy = false;
    render();
  }
}

async function guess(letter) {
  if (busy || game?.status !== "playing" || game.guessed_letters.includes(letter)) return;
  busy = true;
  showError();
  render();
  try {
    game = await api(`/api/games/${game.game_id}/guess`, { letter });
  } catch (error) {
    // A response can be lost after Flask accepted the guess. Re-fetch before
    // enabling input so the page agrees with the server whenever it is reachable.
    try {
      game = await api(`/api/games/${game.game_id}`);
    } catch (recoveryError) {
      if (recoveryError.status === 404) game = null;
    }
    showError(error.message);
  } finally {
    busy = false;
    render();
  }
}

for (const letter of alphabet) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = letter.toUpperCase();
  button.dataset.letter = letter;
  button.addEventListener("click", () => guess(letter));
  keys.set(letter, button);
  el("keyboard").append(button);
}
el("new-game").addEventListener("click", startGame);
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
  if (/^[a-z]$/i.test(event.key) && game?.status === "playing") {
    event.preventDefault();
    guess(event.key.toLowerCase());
  }
});
render();
