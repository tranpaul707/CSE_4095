import { describe, expect, it } from 'vitest';
import {
  calculate,
  DIFFICULTIES,
  generateQuestion,
  inRange,
  OPS,
  priority,
  signature,
  similarQuestion,
  validQuestion,
} from '../src/math';
import type { Pattern } from '../src/types';
let seed = 37;
const rng = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
describe('arithmetic generation', () => {
  for (const operation of OPS)
    for (const difficulty of DIFFICULTIES) {
      it(`${operation}, level ${difficulty}: 500 valid questions and related reviews`, () => {
        const positions = new Set<number>();
        for (let i = 0; i < 500; i++) {
          const q = generateQuestion(operation, difficulty, rng);
          expect(validQuestion(q)).toBe(true);
          expect(q.correctAnswer).toBe(calculate(operation, q.firstOperand, q.secondOperand));
          positions.add(q.choices.indexOf(q.correctAnswer));
          const pattern: Pattern = {
            id: 'pattern',
            question: q,
            incorrectCount: 1,
            similarCorrectCount: 0,
            lastIncorrectAt: new Date().toISOString(),
            mastered: false,
          };
          const next = similarQuestion(pattern, rng);
          expect(validQuestion(next)).toBe(true);
          expect(signature(next)).not.toBe(signature(q));
          expect(next.mistakePatternId).toBe(pattern.id);
          expect(next.difficulty).toBe(difficulty);
        }
        expect(positions.size).toBe(4);
      });
    }
  it('covers intermediate and advanced two-digit multiplication', () => {
    const middle = Array.from({ length: 200 }, () => generateQuestion('multiplication', 3, rng));
    const advanced = Array.from({ length: 200 }, () => generateQuestion('multiplication', 4, rng));
    expect(middle.some((q) => q.secondOperand >= 10)).toBe(true);
    expect(advanced.some((q) => q.secondOperand >= 10)).toBe(true);
    expect(middle.every((q) => q.firstOperand <= 9 || q.secondOperand <= 9)).toBe(true);
  });
  it('handles repeated random values and exclusions without hanging', () => {
    for (const op of OPS)
      for (const level of DIFFICULTIES) {
        const q = generateQuestion(op, level, () => 0);
        const next = generateQuestion(op, level, () => 0, [signature(q)]);
        expect(validQuestion(next)).toBe(true);
        expect(signature(next)).not.toBe(signature(q));
      }
  });
  it('rejects division by zero, fractional division, negatives and out-of-level operands', () => {
    expect(inRange('division', 1, 5, 0)).toBe(false);
    expect(inRange('division', 1, 7, 2)).toBe(false);
    expect(inRange('subtraction', 4, 2, 3)).toBe(false);
    expect(inRange('addition', 1, 11, 0)).toBe(false);
    expect(inRange('multiplication', 1, 6, 0)).toBe(false);
    expect(inRange('division', 3, 156, 12)).toBe(false);
    expect(() => generateQuestion('addition', 9 as never)).toThrow();
  });
  it('uses reversed operands and inverse fact families across generated reviews', () => {
    const q = generateQuestion('multiplication', 2, () => 0.75);
    const pattern: Pattern = {
      id: 'p',
      question: q,
      incorrectCount: 1,
      similarCorrectCount: 0,
      lastIncorrectAt: new Date().toISOString(),
      mastered: false,
    };
    const qs = Array.from({ length: 200 }, () => similarQuestion(pattern, rng));
    expect(qs.some((next) => next.operation === 'division')).toBe(true);
  });
  it('prioritizes frequent, recent and less successful mistakes', () => {
    const p: Pattern = {
      id: 'p',
      question: generateQuestion('addition', 1),
      incorrectCount: 1,
      similarCorrectCount: 0,
      lastIncorrectAt: '2026-10-21T00:00:00Z',
      mastered: false,
    };
    const now = Date.parse(p.lastIncorrectAt);
    expect(priority({ ...p, incorrectCount: 3 }, now)).toBeGreaterThan(priority(p, now));
    expect(priority(p, now)).toBeGreaterThan(
      priority({ ...p, lastIncorrectAt: '2026-01-01T00:00:00Z' }, now),
    );
    expect(priority(p, now)).toBeGreaterThan(priority({ ...p, similarCorrectCount: 2 }, now));
  });
});
