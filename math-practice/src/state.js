import { answerFor, generateQuestions, generateQuestion, choicesFor, questionKey, OPERATIONS, LEVELS } from './engine.js';
export const STORAGE_KEY = 'math-meadow:v1';
export const freshState = () => ({ version: 1, attempts: [], mistakes: [], sessions: [], current: null });
export const uid = () => globalThis.crypto.randomUUID();

export function startSession(state, config, { id = uid(), now = new Date().toISOString(), rng = Math.random } = {}) {
  const next = structuredClone(state);
  let questions;
  if (config.sourceId) {
    const source = state.mistakes.find(m => m.id === config.sourceId);
    if (!source) throw new Error('This mistake is no longer available');
    const q = source.question;
    questions = config.mode === 'exact'
      ? [{ ...q, choices: choicesFor(q.answer, rng) }]
      : Array.from({ length: 5 }, () => generateQuestion(q.operation, q.level, rng, q));
  } else questions = generateQuestions(config.operations, config.level, config.count, rng);
  next.current = {
    id, startedAt: now, questions, index: 0, revealed: false, feedback: null,
    sourceId: config.sourceId || null, mode: config.sourceId ? config.mode : 'practice', status: 'active',
  };
  return next;
}
export function revealAnswer(state) {
  if (!state.current || state.current.status !== 'active' || state.current.feedback) return state;
  const next = structuredClone(state); next.current.revealed = true; return next;
}
export function scoreAnswer(state, { selected = null, selfCorrect = null, now = new Date().toISOString() } = {}) {
  const session = state.current;
  if (!session || session.status !== 'active' || session.feedback) return state;
  const q = session.questions[session.index];
  if (session.revealed ? typeof selfCorrect !== 'boolean' : !q.choices.includes(selected)) throw new Error('Choose an answer or assess the revealed card');
  const next = structuredClone(state);
  const correct = session.revealed ? selfCorrect : selected === q.answer;
  const attempt = {
    id: `${session.id}:${session.index}`, sessionId: session.id, question: q,
    selected: session.revealed ? null : selected, correct, selfReported: session.revealed, at: now,
  };
  if (state.attempts.some(a => a.id === attempt.id)) return state;
  next.attempts.push(attempt);
  next.current.feedback = attempt;
  let mistake = session.sourceId ? next.mistakes.find(m => m.id === session.sourceId) : null;
  if (mistake) {
    mistake.reviews++; mistake.resolved = correct; mistake.lastReviewedAt = now;
    if (!correct) mistake.lastSelected = attempt.selected;
  } else if (!correct) {
    mistake = next.mistakes.find(m => questionKey(m.question) === questionKey(q));
    if (mistake) { mistake.resolved = false; mistake.lastSelected = attempt.selected; mistake.at = now; }
    else next.mistakes.push({ id: attempt.id, question: q, lastSelected: attempt.selected, at: now, resolved: false, reviews: 0 });
  }
  return next;
}
export function advanceQuestion(state, now = new Date().toISOString()) {
  if (!state.current || state.current.status !== 'active' || !state.current.feedback) return state;
  const next = structuredClone(state);
  if (next.current.index + 1 < next.current.questions.length) {
    next.current.index++; next.current.feedback = null; next.current.revealed = false;
  } else {
    next.current.status = 'complete';
    const attempts = next.attempts.filter(a => a.sessionId === next.current.id);
    next.sessions.push({ id: next.current.id, at: now, mode: next.current.mode, total: attempts.length, correct: attempts.filter(a => a.correct).length });
  }
  return next;
}
export function statistics(state) {
  const total = state.attempts.length;
  const correct = state.attempts.filter(a => a.correct).length;
  return { total, correct, incorrect: total - correct, accuracy: total ? Math.round(correct / total * 100) : 0,
    operations: Object.keys(OPERATIONS).map(operation => {
      const attempts = state.attempts.filter(a => a.question.operation === operation);
      return { operation, total: attempts.length, correct: attempts.filter(a => a.correct).length };
    }),
  };
}

function validQuestion(q) {
  return q && Object.hasOwn(OPERATIONS, q.operation) && Object.hasOwn(LEVELS, q.level)
    && Number.isSafeInteger(q.a) && q.a >= 0 && Number.isSafeInteger(q.b) && q.b >= 0
    && (q.operation !== 'divide' || q.b > 0)
    && Number.isSafeInteger(q.answer) && q.answer >= 0 && q.answer === answerFor(q.operation, q.a, q.b)
    && Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4
    && q.choices.includes(q.answer) && q.choices.every(n => Number.isSafeInteger(n) && n >= 0);
}
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
function validAttempt(a) {
  return a && typeof a.id === 'string' && typeof a.sessionId === 'string' && validQuestion(a.question)
    && typeof a.correct === 'boolean' && typeof a.selfReported === 'boolean' && validDate(a.at)
    && (a.selfReported ? a.selected === null : a.question.choices.includes(a.selected) && a.correct === (a.selected === a.question.answer));
}
export function validState(s) {
  if (!(s && s.version === 1 && Array.isArray(s.attempts) && s.attempts.every(validAttempt)
    && new Set(s.attempts.map(a => a.id)).size === s.attempts.length
    && Array.isArray(s.mistakes) && s.mistakes.every(m => m && typeof m.id === 'string' && validQuestion(m.question)
      && typeof m.resolved === 'boolean' && Number.isSafeInteger(m.reviews) && m.reviews >= 0 && validDate(m.at)
      && (m.lastSelected === null || Number.isSafeInteger(m.lastSelected)))
    && Array.isArray(s.sessions) && s.sessions.every(h => h && typeof h.id === 'string' && validDate(h.at)
      && ['practice', 'exact', 'similar'].includes(h.mode) && Number.isInteger(h.total) && h.total > 0
      && Number.isInteger(h.correct) && h.correct >= 0 && h.correct <= h.total))) return false;
  const c = s.current;
  if (c === null) return true;
  if (!(c && typeof c.id === 'string' && validDate(c.startedAt) && ['practice', 'exact', 'similar'].includes(c.mode)
    && ['active', 'complete'].includes(c.status) && Array.isArray(c.questions) && c.questions.length > 0 && c.questions.length <= 20
    && c.questions.every(validQuestion) && Number.isInteger(c.index) && c.index >= 0 && c.index < c.questions.length
    && typeof c.revealed === 'boolean' && (c.sourceId === null || typeof c.sourceId === 'string')
    && (c.feedback === null || validAttempt(c.feedback)))) return false;
  const attempts = s.attempts.filter(a => a.sessionId === c.id);
  const expected = c.index + (c.feedback ? 1 : 0);
  return attempts.length === expected
    && attempts.every((a, i) => a.id === `${c.id}:${i}` && questionKey(a.question) === questionKey(c.questions[i]))
    && (c.feedback === null || c.feedback.id === `${c.id}:${c.index}` && attempts.at(-1).correct === c.feedback.correct)
    && (c.status !== 'complete' || expected === c.questions.length && s.sessions.some(h => h.id === c.id));
}
export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { state: freshState(), warning: '' };
    const parsed = JSON.parse(raw);
    if (!validState(parsed)) throw new Error('Invalid saved progress');
    return { state: parsed, warning: '' };
  } catch {
    return { state: freshState(), warning: 'Saved progress could not be loaded. You can still practice; browser storage may be unavailable or damaged.' };
  }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return ''; }
  catch { return 'Progress is available in this tab, but could not be saved. Check browser storage settings before closing it.'; }
}
