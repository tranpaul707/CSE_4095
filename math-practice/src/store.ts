import type { ActiveSession, AppState, Attempt, Config, Counts, Difficulty, Pattern, Question, Session, Settings, Totals } from './types';
import { DIFFICULTIES, generateQuestion, id, OPS, priority, shuffle, signature, similarQuestion, validQuestion } from './math';
export const PREFIX = 'mathPractice.';
export const MAX_ATTEMPTS = 5000;
export const DEFAULT_SETTINGS: Settings = {
  sound: false, animation: true, explanations: true, feedback: true,
  defaultOperations: [...OPS], defaultDifficulty: 1, defaultLength: 10, masteryThreshold: 3,
};
const counts = (): Counts => ({ attempted: 0, correct: 0, incorrect: 0 });
export const emptyTotals = (): Totals => ({ ...counts(), byOperation: Object.fromEntries(OPS.map(op => [op, counts()])) as Totals['byOperation'], byDifficulty: Object.fromEntries(DIFFICULTIES.map(level => [level, counts()])) as Totals['byDifficulty'], reviewCount: 0, reviewCorrect: 0 });
export const initialState = (): AppState => ({ settings: structuredClone(DEFAULT_SETTINGS), attempts: [], sessions: [], patterns: [], archive: emptyTotals(), active: null, summary: null });
export const accuracy = (value: Counts) => value.attempted ? Math.round(value.correct / value.attempted * 100) : 0;
function addAttempt(totals: Totals, attempt: Attempt) {
  for (const group of [totals, totals.byOperation[attempt.question.operation], totals.byDifficulty[attempt.question.difficulty]]) {
    group.attempted++; if (attempt.selfReportedCorrect) group.correct++; else group.incorrect++;
  }
  if (attempt.question.source === 'mistake-review') { totals.reviewCount++; if (attempt.selfReportedCorrect) totals.reviewCorrect++; }
}
export function totalsFor(state: Pick<AppState, 'attempts' | 'archive'>): Totals {
  const totals = structuredClone(state.archive);
  for (const attempt of state.attempts) addAttempt(totals, attempt);
  return totals;
}
export function activePatterns(state: AppState) { return state.patterns.filter(p => !p.mastered); }
function nextQuestion(state: AppState, config: Config, recent: string[] = [], previousPattern?: string): Question | null {
  if (!config.review) return generateQuestion(config.operations[Math.floor(Math.random() * config.operations.length)], config.difficulty, Math.random, recent.slice(-3));
  const patterns = shuffle(activePatterns(state)).sort((a, b) =>
    (priority(b) - (b.id === previousPattern ? 8 : 0)) - (priority(a) - (a.id === previousPattern ? 8 : 0)));
  if (!patterns.length) return null;
  return similarQuestion(patterns[0], Math.random, recent.slice(-3));
}
export function validConfig(config: Config) {
  return config && Array.isArray(config.operations) && config.operations.length > 0 && config.operations.every(op => OPS.includes(op))
    && DIFFICULTIES.includes(config.difficulty) && [5, 10, 20, 'continuous'].includes(config.length) && typeof config.review === 'boolean';
}
export function startSession(state: AppState, config: Config): AppState {
  if (!validConfig(config)) throw new Error('Choose at least one operation and a difficulty level.');
  const question = nextQuestion(state, config);
  if (!question) throw new Error('No active mistakes to review. Try regular practice first.');
  const session: Session = { operations: [...config.operations], difficulty: config.difficulty, length: config.length, review: config.review, id: id(), startedAt: new Date().toISOString(), attempted: 0, correct: 0, incorrect: 0, reviewCount: 0 };
  return { ...state, summary: null, active: { session, question, selected: null, flipped: false, feedback: null, recent: [signature(question)] } };
}
export function selectAnswer(state: AppState, value: number): AppState {
  const a = state.active;
  if (!a || a.flipped || a.feedback !== null || !a.question.choices.includes(value)) return state;
  return { ...state, active: { ...a, selected: value } };
}
export function flipCard(state: AppState): AppState {
  if (!state.active || state.active.selected === null || state.active.flipped) return state;
  return { ...state, active: { ...state.active, flipped: true } };
}
export function recordResult(state: AppState, correct: boolean): AppState {
  const active = state.active;
  if (!active || active.selected === null || !active.flipped || active.feedback !== null || state.attempts.some(a => a.id === active.question.id)) return state;
  const next = structuredClone(state), a = next.active!;
  const attempt: Attempt = { id: a.question.id, question: a.question, selectedAnswer: a.selected!, selfReportedCorrect: correct, attemptedAt: new Date().toISOString(), sessionId: a.session.id };
  next.attempts.push(attempt);
  a.feedback = correct;
  a.session.attempted++; if (correct) a.session.correct++; else a.session.incorrect++;
  if (a.question.source === 'mistake-review') a.session.reviewCount++;
  const source = next.patterns.find(p => p.id === a.question.mistakePatternId);
  if (source) {
    if (correct) source.similarCorrectCount++;
    else { source.incorrectCount++; source.similarCorrectCount = 0; source.lastIncorrectAt = attempt.attemptedAt; }
    source.mastered = source.similarCorrectCount >= next.settings.masteryThreshold;
  } else if (!correct) {
    const existing = next.patterns.find(p => signature(p.question) === signature(a.question));
    if (existing) { existing.incorrectCount++; existing.similarCorrectCount = 0; existing.mastered = false; existing.lastIncorrectAt = attempt.attemptedAt; }
    else next.patterns.push({ id: id(), question: { ...a.question, source: 'regular', mistakePatternId: undefined }, incorrectCount: 1, similarCorrectCount: 0, lastIncorrectAt: attempt.attemptedAt, mastered: false });
  }
  if (next.attempts.length > MAX_ATTEMPTS) {
    const old = next.attempts.splice(0, next.attempts.length - MAX_ATTEMPTS);
    for (const attempt of old) addAttempt(next.archive, attempt);
  }
  return next;
}
export function endSession(state: AppState): AppState {
  if (!state.active) return state;
  const session = { ...state.active.session, completedAt: new Date().toISOString() };
  return { ...state, active: null, summary: session, sessions: [session, ...state.sessions.filter(s => s.id !== session.id)].slice(0, 100) };
}
export function advance(state: AppState): AppState {
  const a = state.active;
  if (!a || a.feedback === null) return state;
  if (a.session.length !== 'continuous' && a.session.attempted >= a.session.length) return endSession(state);
  const question = nextQuestion(state, a.session, a.recent, a.question.mistakePatternId);
  if (!question) return endSession(state);
  return { ...state, active: { ...a, question, selected: null, flipped: false, feedback: null, recent: [...a.recent, signature(question)].slice(-4) } };
}
export function updateSettings(state: AppState, settings: Settings): AppState {
  if (!validSettings(settings)) throw new Error('Please choose valid settings.');
  return { ...state, settings, patterns: state.patterns.map(p => ({ ...p, mastered: p.similarCorrectCount >= settings.masteryThreshold })) };
}
export function resetHistory(state: AppState): AppState { return { ...initialState(), settings: state.settings }; }

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const whole = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
function validSettings(v: unknown): v is Settings {
  if (!object(v)) return false;
  return ['sound', 'animation', 'explanations', 'feedback'].every(k => typeof v[k] === 'boolean')
    && Array.isArray(v.defaultOperations) && v.defaultOperations.length > 0 && v.defaultOperations.every(op => OPS.includes(op))
    && DIFFICULTIES.includes(v.defaultDifficulty as Difficulty) && [5, 10, 20, 'continuous'].includes(v.defaultLength as number)
    && typeof v.masteryThreshold === 'number' && Number.isInteger(v.masteryThreshold) && v.masteryThreshold >= 1 && v.masteryThreshold <= 10;
}
function validCounts(v: unknown): v is Counts { return object(v) && whole(v.attempted) && whole(v.correct) && whole(v.incorrect) && v.attempted === Number(v.correct) + Number(v.incorrect); }
function validTotals(v: unknown): v is Totals {
  if (!validCounts(v) || !object(v)) return false;
  const t = v as unknown as Totals;
  return object(t.byOperation) && object(t.byDifficulty) && OPS.every(op => validCounts(t.byOperation[op])) && DIFFICULTIES.every(d => validCounts(t.byDifficulty[d]))
    && whole(t.reviewCount) && t.reviewCount <= t.attempted && whole(t.reviewCorrect) && t.reviewCorrect <= t.reviewCount
    && OPS.reduce((sum, op) => sum + t.byOperation[op].attempted, 0) === t.attempted
    && DIFFICULTIES.reduce((sum, d) => sum + t.byDifficulty[d].attempted, 0) === t.attempted;
}
function validAttempt(v: unknown): v is Attempt {
  if (!object(v)) return false;
  const a = v as unknown as Attempt;
  return typeof a.id === 'string' && typeof a.sessionId === 'string' && validQuestion(a.question) && a.id === a.question.id
    && a.question.choices.includes(a.selectedAnswer) && typeof a.selfReportedCorrect === 'boolean' && date(a.attemptedAt);
}
function validSession(v: unknown): v is Session {
  if (!object(v)) return false;
  const s = v as unknown as Session;
  return validConfig(s) && typeof s.id === 'string' && date(s.startedAt) && (!s.completedAt || date(s.completedAt))
    && validCounts(s) && whole(s.reviewCount) && s.reviewCount <= s.attempted;
}
function validPattern(v: unknown): v is Pattern {
  if (!object(v)) return false;
  const p = v as unknown as Pattern;
  return typeof p.id === 'string' && validQuestion(p.question) && whole(p.incorrectCount) && p.incorrectCount > 0
    && whole(p.similarCorrectCount) && date(p.lastIncorrectAt) && typeof p.mastered === 'boolean';
}
function validActive(v: unknown): v is ActiveSession {
  if (!object(v)) return false;
  const a = v as unknown as ActiveSession;
  return validSession(a.session) && !a.session.completedAt && validQuestion(a.question)
    && (a.selected === null || a.question.choices.includes(a.selected)) && typeof a.flipped === 'boolean'
    && (!a.flipped || a.selected !== null) && (a.feedback === null || typeof a.feedback === 'boolean' && a.flipped)
    && Array.isArray(a.recent) && a.recent.every(s => typeof s === 'string');
}
export function load(storage: Pick<Storage, 'getItem'>): { state: AppState; warning: string } {
  const state = initialState(), warnings: string[] = [];
  function read<T>(name: string, validate: (value: unknown) => value is T, fallback: T): T {
    try {
      const raw = storage.getItem(PREFIX + name);
      if (raw === null) return fallback;
      const parsed: unknown = JSON.parse(raw);
      if (!validate(parsed)) throw new Error();
      return parsed;
    } catch { warnings.push(name); return fallback; }
  }
  try {
    const version = storage.getItem(PREFIX + 'version');
    if (version !== null && version !== '1') return { state, warning: 'Saved progress uses a different version. Practice can continue here, but saving is paused to protect it.' };
  } catch { return { state, warning: 'Browser storage is unavailable. You can practice in this tab, but progress may not be saved.' }; }
  state.settings = read('settings', validSettings, state.settings);
  const arrayOf = <T,>(validator: (value: unknown) => value is T) => (value: unknown): value is T[] => Array.isArray(value) && value.every(validator);
  state.attempts = read('attempts', arrayOf(validAttempt), []).filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i);
  state.sessions = read('sessions', arrayOf(validSession), []);
  state.patterns = read('mistakePatterns', arrayOf(validPattern), []).map(p => ({ ...p, mastered: p.similarCorrectCount >= state.settings.masteryThreshold }));
  state.archive = read('statistics', validTotals, emptyTotals());
  state.active = read('activeSession', (v): v is ActiveSession | null => v === null || validActive(v), null);
  state.summary = read('summary', (v): v is Session | null => v === null || validSession(v), null);
  if (state.active) {
    const a = state.active;
    const existing = state.attempts.find(attempt => attempt.id === a.question.id);
    if ((a.feedback !== null && (!existing || existing.selfReportedCorrect !== a.feedback)) || (a.feedback === null && existing)) {
      state.active = null; warnings.push('activeSession');
    }
  }
  return { state, warning: warnings.length ? `Some saved ${warnings.join(', ')} data could not be loaded. Other progress is still available.` : '' };
}
export function save(storage: Pick<Storage, 'setItem'>, state: AppState, previous?: AppState): string {
  try {
    const prior = previous ? { settings: previous.settings, attempts: previous.attempts, sessions: previous.sessions, mistakePatterns: previous.patterns, statistics: previous.archive, activeSession: previous.active, summary: previous.summary } : null;
    for (const [key, value] of Object.entries({ settings: state.settings, attempts: state.attempts, sessions: state.sessions, mistakePatterns: state.patterns, statistics: state.archive, activeSession: state.active, summary: state.summary })) {
      if (!prior || value !== prior[key as keyof typeof prior]) storage.setItem(PREFIX + key, JSON.stringify(value));
    }
    storage.setItem(PREFIX + 'version', '1'); return '';
  } catch { return 'Your practice can continue, but progress could not be saved. Browser storage may be full or unavailable.'; }
}
