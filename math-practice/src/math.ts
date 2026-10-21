import type { Difficulty, Operation, Pattern, Question } from './types';
export const OPERATIONS: Record<Operation, { symbol: string; name: string; color: string }> = {
  addition: { symbol: '+', name: 'Addition', color: 'peach' },
  subtraction: { symbol: '−', name: 'Subtraction', color: 'blue' },
  multiplication: { symbol: '×', name: 'Multiplication', color: 'lavender' },
  division: { symbol: '÷', name: 'Division', color: 'yellow' },
};
export const OPS = Object.keys(OPERATIONS) as Operation[];
export const LEVELS: Record<Difficulty, { name: string; description: string; max: number }> = {
  1: { name: 'Beginner', description: 'Small numbers. A gentle start.', max: 10 },
  2: { name: 'Easy', description: 'Bigger numbers. More confidence.', max: 50 },
  3: { name: 'Intermediate', description: 'Carry, borrow, and stretch.', max: 100 },
  4: { name: 'Advanced', description: 'Big numbers. Bright ideas.', max: 1000 },
};
export const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4];
export const id = () => crypto.randomUUID();
export const int = (min: number, max: number, rng = Math.random) => min + Math.floor(rng() * (max - min + 1));
export function shuffle<T>(values: T[], rng = Math.random): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(0, i, rng); [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function calculate(operation: Operation, a: number, b: number) {
  switch (operation) {
    case 'addition': return a + b;
    case 'subtraction': return a - b;
    case 'multiplication': return a * b;
    case 'division': return a / b;
  }
}
export const signature = (q: Question) => `${q.operation}:${q.difficulty}:${q.firstOperand}:${q.secondOperand}`;
export const expression = (q: Question) => `${q.firstOperand} ${OPERATIONS[q.operation].symbol} ${q.secondOperand}`;
export const spoken = (q: Question) => `${q.firstOperand} ${ { addition: 'plus', subtraction: 'minus', multiplication: 'times', division: 'divided by' }[q.operation]} ${q.secondOperand}`;
export function inRange(operation: Operation, difficulty: Difficulty, a: number, b: number): boolean {
  if (!OPS.includes(operation) || !DIFFICULTIES.includes(difficulty) || !Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0) return false;
  if (operation === 'addition' || operation === 'subtraction') return a <= LEVELS[difficulty].max && b <= LEVELS[difficulty].max && (operation === 'addition' || a >= b);
  if (operation === 'multiplication') {
    if (difficulty <= 2) return a <= (difficulty === 1 ? 5 : 10) && b <= (difficulty === 1 ? 5 : 10);
    if (difficulty === 3) return a <= 99 && b <= 99 && (a <= 9 || b <= 9);
    return a >= 10 && a <= 99 && b >= 1 && b <= 99;
  }
  const maxDivisor = [0, 5, 10, 12, 99][difficulty];
  const maxDividend = [0, 25, 100, 144, 9801][difficulty];
  return b >= 1 && b <= maxDivisor && a <= maxDividend && Number.isInteger(a / b);
}
export function choicesFor(operation: Operation, a: number, b: number, rng = Math.random): number[] {
  const answer = calculate(operation, a, b);
  const pool = shuffle([answer - 1, answer + 1, answer - 2, answer + 2, answer - b, answer + b, answer - a, answer + a,
    ...(operation === 'multiplication' ? [a + b, a * (b + 1), (a + 1) * b] : []),
    ...(operation === 'subtraction' ? [a + b] : []),
    ...(operation === 'division' ? [b, a, answer + 3] : [])], rng);
  const choices = new Set([answer]);
  for (const value of pool) { if (choices.size === 4) break; if (Number.isSafeInteger(value) && value >= 0) choices.add(value); }
  for (let offset = 1; choices.size < 4; offset++) choices.add(answer + offset);
  return shuffle([...choices], rng);
}
function make(operation: Operation, difficulty: Difficulty, a: number, b: number, rng = Math.random): Question {
  return { id: id(), operation, difficulty, firstOperand: a, secondOperand: b, correctAnswer: calculate(operation, a, b), choices: choicesFor(operation, a, b, rng), source: 'regular' };
}
export function validQuestion(q: Question): boolean {
  return !!q && typeof q.id === 'string' && inRange(q.operation, q.difficulty, q.firstOperand, q.secondOperand)
    && Number.isSafeInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer === calculate(q.operation, q.firstOperand, q.secondOperand)
    && Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4
    && q.choices.includes(q.correctAnswer) && q.choices.every(n => Number.isSafeInteger(n) && n >= 0)
    && (q.source === 'regular' || q.source === 'mistake-review' && typeof q.mistakePatternId === 'string');
}
export function generateQuestion(operation: Operation, difficulty: Difficulty, rng = Math.random, exclude: string[] = []): Question {
  if (!OPS.includes(operation) || !DIFFICULTIES.includes(difficulty)) throw new Error('Choose a supported operation and level.');
  for (let tries = 0; tries < 20; tries++) {
    let a = int(0, LEVELS[difficulty].max, rng), b = int(0, LEVELS[difficulty].max, rng);
    if (operation === 'subtraction' && a < b) [a, b] = [b, a];
    if (operation === 'multiplication') {
      if (difficulty <= 2) { const max = difficulty === 1 ? 5 : 10; a = int(0, max, rng); b = int(0, max, rng); }
      else if (difficulty === 3) { a = int(0, 9, rng); b = int(0, rng() < 0.5 ? 99 : 9, rng); }
      else { a = int(10, 99, rng); b = int(1, rng() < 0.5 ? 99 : 9, rng); }
    }
    if (operation === 'division') {
      b = int(1, [0, 5, 10, 12, 99][difficulty], rng);
      const cap = [0, 25, 100, 144, 9801][difficulty];
      const quotient = int(0, Math.min(difficulty === 4 ? 99 : [0, 5, 10, 12][difficulty], Math.floor(cap / b)), rng);
      a = b * quotient;
    }
    const q = make(operation, difficulty, a, b, rng);
    if (validQuestion(q) && !exclude.includes(signature(q))) return q;
  }
  // Bounded, valid fallback also works when a random source repeats forever.
  for (let n = 1; n <= 100; n++) {
    const a = operation === 'division' ? n : operation === 'multiplication' && difficulty === 4 ? 10 + n % 89 : n % (LEVELS[difficulty].max + 1);
    const b = operation === 'subtraction' ? 0 : 1;
    const q = make(operation, difficulty, a, b, rng);
    if (validQuestion(q) && !exclude.includes(signature(q))) return q;
  }
  throw new Error('We could not make a new question. Please start a fresh session.');
}
export function similarQuestion(pattern: Pattern, rng = Math.random, exclude: string[] = [], allowed: Operation[] = OPS): Question {
  const q = pattern.question, a = q.firstOperand, b = q.secondOperand;
  const candidates: [Operation, number, number][] = [];
  for (const delta of [-2, -1, 1, 2]) {
    if (q.operation === 'division') {
      candidates.push(['division', (q.correctAnswer + delta) * b, b], ['division', q.correctAnswer * (b + delta), b + delta]);
    } else candidates.push([q.operation, a + delta, b], [q.operation, a, b + delta]);
  }
  if (q.operation === 'addition' || q.operation === 'multiplication') candidates.push([q.operation, b, a]);
  if (q.operation === 'addition') candidates.push(['subtraction', q.correctAnswer, a], ['subtraction', q.correctAnswer, b]);
  if (q.operation === 'subtraction') candidates.push(['addition', q.correctAnswer, b]);
  if (q.operation === 'multiplication') candidates.push(['division', q.correctAnswer, a], ['division', q.correctAnswer, b]);
  if (q.operation === 'division') candidates.push(['multiplication', q.correctAnswer, b]);
  for (const [operation, first, second] of shuffle(candidates, rng)) {
    if (!allowed.includes(operation) || !inRange(operation, q.difficulty, first, second)) continue;
    const next = make(operation, q.difficulty, first, second, rng);
    if (signature(next) !== signature(q) && !exclude.includes(signature(next))) return { ...next, source: 'mistake-review', mistakePatternId: pattern.id };
  }
  const next = generateQuestion(q.operation, q.difficulty, rng, [...exclude, signature(q)]);
  return { ...next, source: 'mistake-review', mistakePatternId: pattern.id };
}
export function priority(pattern: Pattern, now = Date.now()) {
  const age = Math.max(0, (now - Date.parse(pattern.lastIncorrectAt)) / 86400000);
  return pattern.incorrectCount * 5 + 4 / (1 + age) - pattern.similarCorrectCount * 2;
}
export function explanation(q: Question) {
  const { firstOperand: a, secondOperand: b, correctAnswer: c } = q;
  if (q.operation === 'addition') return `Start with ${a} and add ${b} more. Together they make ${c}.`;
  if (q.operation === 'subtraction') return `Take ${b} away from ${a} to leave ${c}. Check it: ${c} + ${b} = ${a}.`;
  if (q.operation === 'multiplication') return `${a} groups of ${b} make ${c}.`;
  return `Share ${a} equally among ${b} groups. Each group gets ${c}. Check it: ${b} × ${c} = ${a}.`;
}
