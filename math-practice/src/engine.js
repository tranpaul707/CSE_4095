export const OPERATIONS = {
  add: { symbol: '+', name: 'Addition', color: 'peach' },
  subtract: { symbol: '−', name: 'Subtraction', color: 'blue' },
  multiply: { symbol: '×', name: 'Multiplication', color: 'lavender' },
  divide: { symbol: '÷', name: 'Division', color: 'yellow' },
};
export const LEVELS = {
  easy: { name: 'Seedling', subtitle: 'A gentle start', max: 10, facts: 5 },
  medium: { name: 'Growing', subtitle: 'Find your rhythm', max: 50, facts: 10 },
  challenge: { name: 'Blooming', subtitle: 'Stretch your skills', max: 100, facts: 12 },
};
const integer = (max, rng) => Math.floor(rng() * (max + 1));
export function shuffle(values, rng = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = integer(i, rng);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function answerFor(operation, a, b) {
  switch (operation) {
    case 'add': return a + b;
    case 'subtract': return a - b;
    case 'multiply': return a * b;
    case 'divide': return a / b;
    default: throw new Error('Unknown operation');
  }
}
export function questionKey(q) { return `${q.operation}:${q.level}:${q.a}:${q.b}`; }
export function choicesFor(answer, rng = Math.random) {
  const values = new Set([answer]);
  for (let i = 0; i < 24 && values.size < 4; i++) {
    const value = answer + integer(10, rng) - 5;
    if (value >= 0) values.add(value);
  }
  for (let offset = 1; values.size < 4; offset++) values.add(answer + offset);
  return shuffle([...values], rng);
}
export function generateQuestion(operation, level, rng = Math.random, original = null) {
  if (!Object.hasOwn(OPERATIONS, operation) || !Object.hasOwn(LEVELS, level)) throw new Error('Invalid question settings');
  const range = LEVELS[level];
  let a = integer(range.max, rng), b = integer(range.max, rng);
  if (operation === 'subtract' && a < b) [a, b] = [b, a];
  if (operation === 'multiply' || operation === 'divide') {
    a = 1 + integer(range.facts - 1, rng);
    b = 1 + integer(range.facts - 1, rng);
    if (operation === 'divide') a *= b;
  }
  const q = { operation, level, a, b };
  if (original && questionKey(q) === questionKey(original)) {
    if (operation === 'add') q.a = (a + 1) % (range.max + 1);
    if (operation === 'subtract') { q.a = a === range.max ? 0 : a + 1; q.b = 0; }
    if (operation === 'multiply') q.a = a % range.facts + 1;
    if (operation === 'divide') q.a = (a / b % range.facts + 1) * b;
  }
  q.answer = answerFor(operation, q.a, q.b);
  q.choices = choicesFor(q.answer, rng);
  return q;
}
export function generateQuestions(operations, level, count, rng = Math.random) {
  if (!Array.isArray(operations) || !operations.length || operations.some(op => !Object.hasOwn(OPERATIONS, op))) throw new Error('Choose at least one operation');
  if (![5, 10, 20].includes(count)) throw new Error('Choose 5, 10, or 20 questions');
  const questions = [];
  while (questions.length < count) {
    for (const op of shuffle(operations, rng)) {
      if (questions.length === count) break;
      questions.push(generateQuestion(op, level, rng));
    }
  }
  return questions;
}
export function expression(q) { return `${q.a} ${OPERATIONS[q.operation].symbol} ${q.b}`; }
export function explanation(q) {
  if (q.operation === 'divide') return `${q.b} × ${q.answer} = ${q.a}, so ${expression(q)} = ${q.answer}.`;
  if (q.operation === 'subtract') return `${q.answer} + ${q.b} = ${q.a}, so ${expression(q)} = ${q.answer}.`;
  return `${expression(q)} = ${q.answer}.`;
}
