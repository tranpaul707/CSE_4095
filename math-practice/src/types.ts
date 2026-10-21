export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Difficulty = 1 | 2 | 3 | 4;
export type SessionLength = 5 | 10 | 20 | 'continuous';
export interface Question {
  id: string; operation: Operation; difficulty: Difficulty;
  firstOperand: number; secondOperand: number; correctAnswer: number; choices: number[];
  source: 'regular' | 'mistake-review'; mistakePatternId?: string;
}
export interface Attempt {
  id: string; question: Question; selectedAnswer: number; selfReportedCorrect: boolean;
  attemptedAt: string; sessionId: string;
}
export interface Pattern {
  id: string; question: Question; incorrectCount: number; similarCorrectCount: number;
  lastIncorrectAt: string; mastered: boolean;
}
export interface Config {
  operations: Operation[]; difficulty: Difficulty; length: SessionLength; review: boolean;
}
export interface Session extends Config {
  id: string; startedAt: string; completedAt?: string;
  attempted: number; correct: number; incorrect: number; reviewCount: number;
}
export interface ActiveSession {
  session: Session; question: Question; selected: number | null; flipped: boolean;
  feedback: boolean | null; recent: string[];
}
export interface Settings {
  sound: boolean; animation: boolean; explanations: boolean; feedback: boolean;
  defaultOperations: Operation[]; defaultDifficulty: Difficulty; defaultLength: SessionLength;
  masteryThreshold: number;
}
export interface Counts { attempted: number; correct: number; incorrect: number }
export interface Totals extends Counts {
  byOperation: Record<Operation, Counts>; byDifficulty: Record<Difficulty, Counts>; reviewCount: number; reviewCorrect: number;
}
export interface AppState {
  settings: Settings; attempts: Attempt[]; sessions: Session[]; patterns: Pattern[];
  archive: Totals; active: ActiveSession | null; summary: Session | null;
}
