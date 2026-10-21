import { expect, it } from 'vitest';
import {
  advance,
  endSession,
  flipCard,
  initialState,
  load,
  MAX_ATTEMPTS,
  PREFIX,
  recordResult,
  resetHistory,
  save,
  selectAnswer,
  startSession,
  totalsFor,
  updateSettings,
} from '../src/store';
import type { AppState, Config } from '../src/types';
const config: Config = { operations: ['addition'], difficulty: 1, length: 5, review: false };
const start = () => startSession(initialState(), config);
function answer(s: AppState, correct = true) {
  return recordResult(flipCard(selectAnswer(s, s.active!.question.choices[0])), correct);
}
const memory = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => map.delete(k),
  };
};
it('requires selection then flip before self-report and counts once', () => {
  let s = start();
  expect(recordResult(s, false)).toBe(s);
  expect(flipCard(s)).toBe(s);
  s = selectAnswer(s, s.active!.question.correctAnswer);
  expect(totalsFor(s).attempted).toBe(0);
  expect(recordResult(s, true)).toBe(s);
  s = flipCard(s);
  expect(selectAnswer(s, 100)).toBe(s);
  s = recordResult(s, false);
  expect(recordResult(s, true)).toBe(s);
  expect(s.attempts[0].selfReportedCorrect).toBe(false);
  expect(s.attempts[0].selectedAnswer).toBe(s.active!.question.correctAnswer);
  expect(s.patterns).toHaveLength(1);
});
it('completes a fixed session with exact totals and an available mistake', () => {
  let s = start();
  for (let i = 0; i < 5; i++) s = advance(answer(s, i < 4));
  expect(s.active).toBeNull();
  expect(s.summary).toMatchObject({ attempted: 5, correct: 4, incorrect: 1 });
  expect(s.sessions).toHaveLength(1);
  expect(s.patterns.some((p) => !p.mastered)).toBe(true);
  expect(totalsFor(s).attempted).toBe(5);
});
it('keeps continuous sessions active until ended explicitly', () => {
  let s = startSession(initialState(), { ...config, length: 'continuous' });
  for (let i = 0; i < 25; i++) s = advance(answer(s));
  expect(s.active?.session.attempted).toBe(25);
  s = endSession(s);
  expect(s.summary?.attempted).toBe(25);
  expect(endSession(s)).toBe(s);
});
it('masters a mistake after three successful reviews and reactivates it on a later miss', () => {
  let s = endSession(answer(start(), false));
  const q = s.patterns[0].question;
  s = startSession(s, { ...config, review: true, length: 'continuous' });
  for (let i = 0; i < 3; i++) s = advance(answer(s));
  expect(s.active).toBeNull();
  expect(s.patterns[0]).toMatchObject({ mastered: true, similarCorrectCount: 3 });
  expect(s.summary?.reviewCount).toBe(3);
  s = startSession(s, config);
  s.active!.question = { ...q, id: crypto.randomUUID() };
  s = answer(s, false);
  expect(s.patterns).toHaveLength(1);
  expect(s.patterns[0]).toMatchObject({
    mastered: false,
    similarCorrectCount: 0,
    incorrectCount: 2,
  });
});
it('an incorrect review resets progress on its original pattern', () => {
  let s = endSession(answer(start(), false));
  s = startSession(s, { ...config, review: true });
  s = advance(answer(s));
  s = answer(s, false);
  expect(s.patterns).toHaveLength(1);
  expect(s.patterns[0]).toMatchObject({ similarCorrectCount: 0, incorrectCount: 2 });
});
it('settings change the mastery threshold and reset history retains preferences', () => {
  let s = endSession(answer(start(), false));
  s.patterns[0].similarCorrectCount = 2;
  s = updateSettings(s, { ...s.settings, masteryThreshold: 2, sound: true });
  expect(s.patterns[0].mastered).toBe(true);
  const reset = resetHistory(s);
  expect(reset.attempts).toHaveLength(0);
  expect(reset.settings.sound).toBe(true);
});
it('restores selected, flipped and scored cards without double counting', () => {
  const storage = memory();
  let s = start();
  s = flipCard(selectAnswer(s, s.active!.question.correctAnswer));
  save(storage, s);
  expect(load(storage).state.active).toEqual(s.active);
  s = recordResult(s, false);
  save(storage, s);
  const restored = load(storage);
  expect(restored.warning).toBe('');
  expect(restored.state).toEqual(s);
  expect(recordResult(restored.state, false).attempts).toHaveLength(1);
  expect(advance(restored.state).active?.flipped).toBe(false);
});
it('corrupt storage recovers only its category and unavailable storage does not crash', () => {
  const storage = memory();
  const s = answer(start());
  save(storage, s);
  storage.setItem(PREFIX + 'settings', '{bad');
  storage.setItem('unrelated', 'keep');
  expect(load(storage).state.attempts).toHaveLength(1);
  expect(load(storage).warning).toContain('settings');
  expect(storage.getItem('unrelated')).toBe('keep');
  const blocked = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  expect(load(blocked).warning).toContain('unavailable');
  expect(save(blocked, s)).toContain('could not be saved');
});
it('archives old attempts while preserving lifetime totals and operation/difficulty counts', () => {
  let s = start();
  const sample = answer(s).attempts[0];
  s.attempts = Array.from({ length: MAX_ATTEMPTS }, (_, i) => ({
    ...sample,
    id: `old-${i}`,
    question: { ...sample.question, id: `old-${i}` },
  }));
  s = answer(s, false);
  expect(s.attempts).toHaveLength(MAX_ATTEMPTS);
  expect(s.archive.attempted).toBe(1);
  expect(totalsFor(s)).toMatchObject({
    attempted: MAX_ATTEMPTS + 1,
    correct: MAX_ATTEMPTS,
    incorrect: 1,
  });
  expect(totalsFor(s).byDifficulty[1].attempted).toBe(MAX_ATTEMPTS + 1);
  const storage = memory();
  expect(save(storage, s)).toBe('');
  expect(load(storage).warning).toBe('');
});

it('Practice Again creates a fresh active session without the old completion timestamp', () => {
  const finished = endSession(answer(start()));
  const next = startSession(finished, finished.summary!);
  expect(next.active!.session.completedAt).toBeUndefined();
  expect(next.active!.session.id).not.toBe(finished.summary!.id);
  expect(next.active!.session.attempted).toBe(0);
  const storage = memory();
  save(storage, next);
  expect(load(storage).state.active).toEqual(next.active);
});

it('large-history statistics are quick to compute and storage remains bounded', () => {
  const s = answer(start());
  const sample = s.attempts[0];
  s.attempts = Array.from({ length: MAX_ATTEMPTS }, (_, i) => ({
    ...sample,
    id: `measure-${i}`,
    question: { ...sample.question, id: `measure-${i}` },
  }));
  const before = performance.now();
  const totals = totalsFor(s);
  const elapsed = performance.now() - before;
  expect(totals.attempted).toBe(MAX_ATTEMPTS);
  expect(elapsed).toBeLessThan(250);
  const bytes = new TextEncoder().encode(JSON.stringify(s)).byteLength;
  expect(bytes).toBeLessThan(4_000_000);
});

it('unknown schema versions stay protected and invalid archives do not erase valid attempts', () => {
  const storage = memory();
  const s = answer(start());
  save(storage, s);
  const corrupt = structuredClone(s.archive);
  corrupt.attempted = 1;
  corrupt.correct = 1;
  storage.setItem(PREFIX + 'statistics', JSON.stringify(corrupt));
  const recovered = load(storage);
  expect(recovered.warning).toContain('statistics');
  expect(recovered.state.attempts).toHaveLength(1);
  storage.setItem(PREFIX + 'version', '99');
  expect(load(storage).warning).toContain('different version');
  expect(storage.getItem(PREFIX + 'version')).toBe('99');
});
