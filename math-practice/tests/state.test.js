import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshState, startSession, scoreAnswer, revealAnswer, advanceQuestion, statistics, loadState, saveState, validState } from '../src/state.js';
import { questionKey } from '../src/engine.js';
const start = () => startSession(freshState(), { operations: ['add'], level: 'easy', count: 5 });
const q = s => s.current.questions[s.current.index];
const wrong = s => q(s).choices.find(n => n !== q(s).answer);
test('a complete mixed-result session has accurate summary and no duplicate scores', () => {
  let s = start();
  assert.equal(advanceQuestion(s), s);
  for (let i = 0; i < 5; i++) {
    s = scoreAnswer(s, { selected: i < 3 ? q(s).answer : wrong(s) });
    assert.equal(scoreAnswer(s, { selected: q(s).answer }), s);
    assert.ok(validState(s));
    s = advanceQuestion(s); assert.ok(validState(s));
  }
  assert.equal(s.current.status, 'complete');
  assert.equal(s.sessions.length, 1); assert.equal(s.sessions[0].correct, 3);
  assert.deepEqual([statistics(s).total, statistics(s).incorrect, statistics(s).accuracy], [5, 2, 60]);
  assert.equal(advanceQuestion(s), s);
});
test('revealing requires explicit self-assessment and records its source', () => {
  let s = revealAnswer(start());
  assert.equal(s.attempts.length, 0);
  assert.throws(() => scoreAnswer(s, { selected: q(s).answer }));
  s = scoreAnswer(s, { selfCorrect: false });
  assert.equal(s.attempts[0].selfReported, true); assert.equal(s.attempts[0].selected, null);
  assert.equal(s.mistakes.length, 1); assert.ok(validState(s));
});
test('exact and similar reviews resolve or retain their source mistake', () => {
  let s = start(); s = scoreAnswer(s, { selected: wrong(s) });
  const source = s.mistakes[0];
  s = startSession(s, { sourceId: source.id, mode: 'exact' });
  assert.equal(questionKey(q(s)), questionKey(source.question));
  s = scoreAnswer(s, { selected: q(s).answer }); s = advanceQuestion(s);
  assert.equal(s.mistakes[0].resolved, true); assert.ok(validState(s));
  s = startSession(s, { sourceId: source.id, mode: 'similar' });
  assert.equal(s.current.questions.length, 5);
  assert.ok(s.current.questions.every(item => questionKey(item) !== questionKey(source.question)));
  s = scoreAnswer(s, { selected: wrong(s) });
  assert.equal(s.mistakes[0].resolved, false); assert.equal(s.mistakes.length, 1);
  assert.equal(s.mistakes[0].reviews, 2); assert.ok(validState(s));
});
test('persistence restores scored feedback without a duplicate attempt', () => {
  const storage = { value: null, getItem() { return this.value; }, setItem(k, v) { this.value = v; } };
  let s = start(); s = scoreAnswer(s, { selected: q(s).answer });
  assert.equal(saveState(storage, s), '');
  const restored = loadState(storage);
  assert.equal(restored.warning, ''); assert.deepEqual(restored.state, s);
  assert.equal(scoreAnswer(restored.state, { selected: q(s).answer }).attempts.length, 1);
  assert.equal(advanceQuestion(restored.state).current.index, 1);
});
test('bad or inaccessible storage is recoverable; inconsistent current state is rejected', () => {
  for (const value of ['bad json', '{"version":9}', '{"version":1,"attempts":[],"mistakes":[],"sessions":[],"current":{}}']) {
    const result = loadState({ getItem: () => value }); assert.ok(result.warning); assert.deepEqual(result.state, freshState());
  }
  const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  assert.ok(loadState(blocked).warning); assert.ok(saveState(blocked, freshState()));
  const s = start(); s.current.index = 1; assert.equal(validState(s), false);
});
test('new sessions retain previous attempts and statistics', () => {
  let s = start(); s = scoreAnswer(s, { selected: q(s).answer });
  s = startSession(s, { operations: ['divide'], level: 'challenge', count: 5 });
  assert.equal(statistics(s).total, 1); assert.equal(s.sessions.length, 0);
});
