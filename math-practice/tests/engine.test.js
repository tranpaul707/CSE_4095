import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestion, generateQuestions, questionKey, answerFor, OPERATIONS, LEVELS, choicesFor } from '../src/engine.js';
let seed = 9071;
const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
for (const op of Object.keys(OPERATIONS)) for (const level of Object.keys(LEVELS)) {
  test(`${op}/${level}: 500 valid questions, unique choices and bounded operands`, () => {
    const range = LEVELS[level];
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion(op, level, rng);
      assert.equal(q.answer, answerFor(op, q.a, q.b));
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0);
      assert.equal(q.choices.length, 4); assert.equal(new Set(q.choices).size, 4);
      assert.equal(q.choices.filter(n => n === q.answer).length, 1);
      assert.ok(q.choices.every(n => Number.isInteger(n) && n >= 0));
      if (op === 'add' || op === 'subtract') assert.ok(q.a <= range.max && q.b <= range.max);
      if (op === 'subtract') assert.ok(q.a >= q.b);
      if (op === 'multiply') assert.ok(q.a >= 1 && q.a <= range.facts && q.b >= 1 && q.b <= range.facts);
      if (op === 'divide') assert.ok(q.b >= 1 && q.b <= range.facts && q.answer >= 1 && q.answer <= range.facts);
      const similar = generateQuestion(op, level, rng, q);
      assert.notEqual(questionKey(similar), questionKey(q));
      assert.equal(similar.operation, op); assert.equal(similar.level, level);
    }
  });
}
test('repeated randomness cannot hang choices or repeat a targeted question', () => {
  assert.equal(new Set(choicesFor(0, () => 0)).size, 4);
  for (const op of Object.keys(OPERATIONS)) {
    const q = generateQuestion(op, 'easy', () => 0);
    assert.notEqual(questionKey(generateQuestion(op, 'easy', () => 0, q)), questionKey(q));
  }
});
test('mixed sessions balance operations; invalid settings fail explicitly', () => {
  const qs = generateQuestions(Object.keys(OPERATIONS), 'challenge', 20, rng);
  for (const op of Object.keys(OPERATIONS)) assert.equal(qs.filter(q => q.operation === op).length, 5);
  assert.throws(() => generateQuestions([], 'easy', 5));
  assert.throws(() => generateQuestions(['add'], 'easy', 0));
  assert.throws(() => generateQuestion('unknown', 'easy'));
  assert.throws(() => generateQuestion('add', 'unknown'));
});
