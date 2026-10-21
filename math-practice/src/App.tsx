import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  createBrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  RouterProvider,
  useBlocker,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AppProvider, useApp } from './context';
import {
  Badge,
  ConfirmDialog,
  DifficultySelector,
  EmptyState,
  Garden,
  Metrics,
  OperationSelector,
  PageTitle,
} from './components';
import { explanation, expression, LEVELS, OPERATIONS, OPS, spoken } from './math';
import {
  activePatterns,
  advance,
  endSession,
  flipCard,
  recordResult,
  selectAnswer,
  startSession,
  totalsFor,
} from './store';
import type { Config, SessionLength } from './types';
import { playSound } from './sound';
const StatisticsPage = lazy(() => import('./StatisticsPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));

function Layout() {
  const { state, change, warning, dismissWarning, isSessionActive } = useApp();
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isSessionActive() &&
      currentLocation.pathname === '/practice/session' &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!state.active) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.active !== null]);
  const { attempts, archive } = state;
  const total = useMemo(() => totalsFor({ attempts, archive }), [attempts, archive]);
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-icon" aria-hidden="true">
            ✳
          </span>
          <span>
            math meadow<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <NavLink
            to="/practice/setup"
            className={({ isActive }) =>
              isActive || location.pathname === '/practice/session' ? 'active' : ''
            }
          >
            Practice
          </NavLink>
          <NavLink to="/statistics">
            Statistics{' '}
            {activePatterns(state).length > 0 && (
              <span
                className="nav-count"
                aria-label={`${activePatterns(state).length} active mistakes`}
              >
                {activePatterns(state).length}
              </span>
            )}
          </NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <span className="header-note">Small steps. Big possibilities.</span>
      </header>
      {warning && (
        <div className="warning" role="status">
          <span>{warning}</span>
          <button className="text-button" onClick={dismissWarning}>
            Dismiss
          </button>
        </div>
      )}
      {state.active && location.pathname !== '/practice/session' && (
        <div className="resume-banner">
          Your practice is waiting. <Link to="/practice/session">Resume session →</Link>
        </div>
      )}
      <main ref={main} id="main" tabIndex={-1}>
        <Suspense fallback={<p role="status">Getting things ready…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer>
        <span>Made for curious minds.</span>
        <span>
          {total.attempted
            ? `${total.attempted} little steps taken. Keep growing!`
            : 'Progress stays in this browser. No account needed.'}
        </span>
        <span className="footer-flower" aria-hidden="true">
          ✳
        </span>
      </footer>
      {blocker.state === 'blocked' && (
        <ConfirmDialog
          title="Leave this practice?"
          confirmLabel="End session and leave"
          onCancel={() => blocker.reset()}
          onConfirm={() => {
            change(endSession);
            blocker.proceed();
          }}
        >
          Your answered questions will be saved. You can cancel to keep practicing.
        </ConfirmDialog>
      )}
    </>
  );
}
export function HomePage() {
  const { state } = useApp();
  const { attempts, archive } = state;
  const totals = useMemo(() => totalsFor({ attempts, archive }), [attempts, archive]);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <Badge>BIG IDEAS START WITH LITTLE STEPS</Badge>
          <h1>
            A little practice.
            <br />A lot of <em>growth.</em>
          </h1>
          <p>
            Make friends with numbers. Build your confidence.
            <br className="desktop-break" /> Grow a little more with every question.
          </p>
          <div className="button-row">
            <Link className="button" to={state.active ? '/practice/session' : '/practice/setup'}>
              {state.active ? 'Resume Practice' : 'Start Practice'}{' '}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="button secondary" to="/statistics">
              View Statistics
            </Link>
          </div>
          <span className="hero-note">
            <span aria-hidden="true">✓</span> Your pace. Your progress. No pressure.
          </span>
        </div>
        <Garden />
      </section>
      <section className="home-bottom">
        <div>
          <span className="eyebrow">ROOM TO GROW</span>
          <h2>
            Four ways to stretch
            <br />
            your number skills.
          </h2>
          <Link className="text-link" to="/settings">
            Make it your own in Settings →
          </Link>
        </div>
        <div className="home-operations">
          {OPS.map((op) => (
            <Link
              key={op}
              className={`home-operation ${OPERATIONS[op].color}`}
              to="/practice/setup"
              state={{ operation: op }}
            >
              <span className="op-symbol" aria-hidden="true">
                {OPERATIONS[op].symbol}
              </span>
              <strong>{OPERATIONS[op].name}</strong>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
      {totals.attempted > 0 && (
        <section className="panel home-progress">
          <div>
            <span className="eyebrow">LOOK HOW FAR YOU’VE GROWN</span>
            <h2>Your little victories</h2>
          </div>
          <Metrics value={totals} />
        </section>
      )}
      <div className="small-print">
        Ages 7–12 · Four levels of discovery · No accounts, ads, or tracking
      </div>
    </>
  );
}
function SetupPage() {
  const { state, change } = useApp(),
    navigate = useNavigate(),
    location = useLocation();
  const active = activePatterns(state);
  const [config, setConfig] = useState<Config>(() => ({
    operations:
      location.state?.operation && OPS.includes(location.state.operation)
        ? [location.state.operation]
        : [...state.settings.defaultOperations],
    difficulty: state.settings.defaultDifficulty,
    length: state.settings.defaultLength,
    review: !!location.state?.review && active.length > 0,
  }));
  const [error, setError] = useState(''),
    [replace, setReplace] = useState(false);
  function begin() {
    try {
      change((s) => startSession(s.active ? endSession(s) : s, config));
      navigate('/practice/session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please choose your practice options again.');
    }
  }
  return (
    <>
      <PageTitle eyebrow="LET’S MAKE A LITTLE PROGRESS" title="Your practice, your way.">
        Pick something to explore. Every question is a chance to grow.
      </PageTitle>
      <form
        className="setup-layout"
        onSubmit={(e) => {
          e.preventDefault();
          if (state.active) setReplace(true);
          else begin();
        }}
      >
        <div className="panel setup-panel">
          <fieldset>
            <legend>A fresh start or a little extra practice?</legend>
            <div className="segmented">
              <button
                type="button"
                aria-pressed={!config.review}
                onClick={() => setConfig({ ...config, review: false })}
              >
                Regular Practice
              </button>
              <button
                type="button"
                aria-pressed={config.review}
                disabled={!active.length}
                onClick={() => setConfig({ ...config, review: true })}
              >
                Mistake Review <span className="nav-count">{active.length}</span>
              </button>
            </div>
            <p className="help">
              {active.length
                ? `${active.length} active mistake pattern${active.length === 1 ? '' : 's'} ready for extra practice.`
                : 'Mistake review will unlock after you mark a question “I Got It Wrong.”'}
            </p>
          </fieldset>
          {!config.review ? (
            <>
              <OperationSelector
                value={config.operations}
                onChange={(operations) => setConfig({ ...config, operations })}
              />
              <DifficultySelector
                value={config.difficulty}
                onChange={(difficulty) => setConfig({ ...config, difficulty })}
              />
            </>
          ) : (
            <div className="review-note">
              <h2>A fresh angle on familiar facts</h2>
              <p>
                We’ll use nearby numbers, reversed facts, and related operations from your saved
                mistakes. Each question keeps its original level.
              </p>
              <p>
                Your current mastery goal is {state.settings.masteryThreshold} successful reviews
                per pattern.
              </p>
            </div>
          )}
          <fieldset>
            <legend>How long would you like to practice?</legend>
            <div className="length-options">
              {([5, 10, 20, 'continuous'] as SessionLength[]).map((length) => (
                <label key={length} className={config.length === length ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="length"
                    value={length}
                    checked={config.length === length}
                    onChange={() => setConfig({ ...config, length })}
                  />
                  <span>{length === 'continuous' ? 'Keep going' : `${length} questions`}</span>
                </label>
              ))}
            </div>
            <p className="help">
              {config.length === 'continuous'
                ? 'Practice at your own pace. End the session whenever you’re ready.'
                : 'A small, achievable goal. You can end a session early if you need to.'}
            </p>
          </fieldset>
          {!config.operations.length && (
            <p className="inline-error" role="status">
              Choose at least one operation to begin.
            </p>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button full-width"
            disabled={!config.operations.length || (config.review && !active.length)}
          >
            Start Session <span aria-hidden="true">→</span>
          </button>
          <p className="help centered">
            These choices are for this session. Change your defaults in Settings.
          </p>
        </div>
        <aside className="setup-aside">
          <span className="aside-flower" aria-hidden="true">
            ✳
          </span>
          <h2>
            A good place
            <br />
            to begin.
          </h2>
          <p>
            Choose an answer.
            <br />
            Flip to discover.
            <br />
            Tell us how you did.
          </p>
          <div className="aside-tip">
            <strong>A little reminder</strong>
            <p>Mistakes help us learn what to practice next. Take your time—you’ve got this.</p>
          </div>
        </aside>
      </form>
      {replace && (
        <ConfirmDialog
          title="Start a new session?"
          confirmLabel="Save and start new"
          onCancel={() => setReplace(false)}
          onConfirm={() => {
            setReplace(false);
            begin();
          }}
        >
          Your current session will end. Answers you’ve already recorded will stay in your progress.
        </ConfirmDialog>
      )}
    </>
  );
}
function PracticePage() {
  const { state, change } = useApp();
  const [ending, setEnding] = useState(false),
    [error, setError] = useState('');
  const active = state.active;
  const firstChoice = useRef<HTMLButtonElement>(null),
    firstResult = useRef<HTMLButtonElement>(null);
  const questionId = active?.question.id,
    flipped = active?.flipped;
  useEffect(() => {
    if (!active || active.feedback === null) return;
    const timer = window.setTimeout(
      () => {
        try {
          change(advance);
        } catch {
          setError(
            'We had trouble making the next question. End this session and start a new one. Your answers are saved.',
          );
        }
      },
      state.settings.feedback ? 1500 : state.settings.sound ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [questionId, active?.feedback, state.settings.feedback, state.settings.sound]);
  useEffect(() => {
    if (flipped) firstResult.current?.focus();
    else firstChoice.current?.focus();
  }, [questionId, flipped]);
  useEffect(() => {
    if (!active || active.flipped) return;
    const handler = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        (e.target instanceof HTMLElement &&
          e.target.closest('input,textarea,select,[contenteditable="true"]'))
      )
        return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < 4) {
        e.preventDefault();
        change((s) => selectAnswer(s, active.question.choices[index]));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [questionId, active?.flipped]);
  if (!active)
    return state.summary ? (
      <Navigate replace to="/practice/summary" />
    ) : (
      <>
        <PageTitle eyebrow="A FRESH START" title="Ready when you are." />
        <EmptyState title="Let’s set up your practice first.">
          Choose your operations, level, and session length to begin.
        </EmptyState>
        <Link className="button" to="/practice/setup">
          Set Up Practice
        </Link>
      </>
    );
  const { question: q, session, selected, feedback } = active;
  const percent = session.length === 'continuous' ? 0 : (session.attempted / session.length) * 100;
  function report(correct: boolean) {
    change((s) => recordResult(s, correct));
    if (state.settings.sound) void playSound(correct ? 'correct' : 'incorrect');
  }
  return (
    <div className="practice-wrap">
      <div className="practice-top">
        <Link className="text-link" to="/practice/setup">
          ← Practice setup
        </Link>
        <Badge>{session.review ? 'MISTAKE REVIEW' : 'A LITTLE DAILY GROWTH'}</Badge>
        <button className="text-button" onClick={() => setEnding(true)}>
          End Session
        </button>
      </div>
      <div className="practice-progress">
        <span role="status">
          {session.length === 'continuous'
            ? `Question ${session.attempted + (feedback === null ? 1 : 0)} · Keep going`
            : `Question ${Math.min(session.attempted + (feedback === null ? 1 : 0), session.length)} of ${session.length}`}
        </span>
        <span>
          {LEVELS[q.difficulty].name} · {OPERATIONS[q.operation].name}
        </span>
      </div>
      {session.length !== 'continuous' && (
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Session progress"
          aria-valuenow={session.attempted}
          aria-valuemin={0}
          aria-valuemax={session.length}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      )}
      <section
        key={`${q.id}-${active.flipped}`}
        className={`question-card ${active.flipped ? 'is-flipped' : ''} ${state.settings.animation ? 'animated' : ''}`}
        aria-label={active.flipped ? 'Answer side' : 'Question side'}
      >
        <div className="question-label">
          <span>{active.flipped ? 'LET’S TAKE A LOOK' : 'ONE LITTLE QUESTION'}</span>
          <span aria-hidden="true">✳</span>
        </div>
        <div className="card-face" aria-live="polite" aria-atomic="true">
          <h1
            className="equation"
            aria-label={`${spoken(q)} equals ${active.flipped ? q.correctAnswer : 'what?'}`}
          >
            {expression(q)} <span className="equals">=</span>{' '}
            <span className="answer-number">{active.flipped ? q.correctAnswer : '?'}</span>
          </h1>
        </div>
        {!active.flipped ? (
          <>
            <p className="question-prompt">Which answer feels right?</p>
            <div className="answer-grid">
              {q.choices.map((choice, i) => (
                <button
                  ref={i === 0 ? firstChoice : undefined}
                  key={choice}
                  className={`answer-choice ${selected === choice ? 'selected' : ''}`}
                  aria-pressed={selected === choice}
                  aria-label={`Answer ${i + 1}: ${choice}`}
                  onClick={() => change((s) => selectAnswer(s, choice))}
                >
                  <span className="choice-index" aria-hidden="true">
                    {i + 1}
                  </span>
                  <strong>{choice}</strong>
                  <span className="choice-check" aria-hidden="true">
                    {selected === choice ? '✓' : ''}
                  </span>
                </button>
              ))}
            </div>
            <button
              className="button flip-button"
              disabled={selected === null}
              aria-expanded={false}
              onClick={() => {
                change(flipCard);
                if (state.settings.sound) void playSound('flip');
              }}
            >
              Flip Card <span aria-hidden="true">↻</span>
            </button>
            <p className="help centered">
              {selected === null
                ? 'Pick an answer first. You can change it before you flip.'
                : 'Ready to discover? Flip the card to see the answer.'}
            </p>
          </>
        ) : (
          <>
            <div className="your-answer">
              Your answer: <strong>{selected}</strong>
            </div>
            {state.settings.explanations && <p className="explanation">{explanation(q)}</p>}
            <p className="question-prompt">How did you do?</p>
            <div className="result-buttons">
              <button
                ref={firstResult}
                className="button"
                disabled={feedback !== null}
                onClick={() => report(true)}
              >
                ✓ I Got It Right
              </button>
              <button
                className="button secondary"
                disabled={feedback !== null}
                onClick={() => report(false)}
              >
                ↻ I Got It Wrong
              </button>
            </div>
            <p className="help centered">
              Your report is what counts. Mistakes are a place to grow.
            </p>
            <div className="feedback-message" role="status">
              {feedback !== null && state.settings.feedback
                ? feedback
                  ? 'Nice work! Your confidence is growing. ✳'
                  : 'Good effort. We’ll give this a little more practice. ✳'
                : feedback !== null
                  ? 'Saved. Getting your next question ready…'
                  : '\u00a0'}
            </div>
          </>
        )}
      </section>
      <div className="session-tally">
        <span>
          <strong>{session.correct}</strong> correct
        </span>
        <span>
          <strong>{session.incorrect}</strong> to practice
        </span>
        <span>Take your time. You’re doing something good.</span>
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {ending && (
        <ConfirmDialog
          title="Ready to finish?"
          confirmLabel="End Session"
          onCancel={() => setEnding(false)}
          onConfirm={() => {
            setEnding(false);
            change(endSession);
          }}
        >
          We’ll save your answered questions and show your progress. This question won’t count
          unless you’ve already reported a result.
        </ConfirmDialog>
      )}
    </div>
  );
}
function SummaryPage() {
  const { state, change } = useApp(),
    navigate = useNavigate();
  const session = state.summary;
  if (!session)
    return (
      <>
        <PageTitle eyebrow="YOUR PROGRESS" title="A fresh page awaits." />
        <EmptyState title="No session summary yet.">
          Finish a practice session to see what you’ve learned.
        </EmptyState>
        <Link className="button" to="/practice/setup">
          Start Practice
        </Link>
      </>
    );
  const patterns = activePatterns(state);
  function again() {
    try {
      change((s) => startSession(s, session!));
      navigate('/practice/session');
    } catch {
      navigate('/practice/setup', { state: { review: session!.review } });
    }
  }
  return (
    <div className="summary-wrap">
      <PageTitle eyebrow="EVERY LITTLE STEP COUNTS" title="Look at you grow!">
        You made time to practice. That’s something to feel good about.
      </PageTitle>
      <section className="panel summary-card">
        <span className="summary-flower" aria-hidden="true">
          ✳
        </span>
        <h2>Session complete</h2>
        <Metrics value={session} label="Session results" />
        <dl className="summary-details">
          <div>
            <dt>Operations</dt>
            <dd>
              {session.attempted
                ? (session.practicedOperations || session.operations)
                    .map((op) => OPERATIONS[op].name)
                    .join(', ')
                : 'No questions recorded'}
            </dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>
              {session.attempted
                ? (session.practicedDifficulties || [session.difficulty])
                    .map((level) => LEVELS[level].name)
                    .join(', ')
                : LEVELS[session.difficulty].name}
            </dd>
          </div>
          <div>
            <dt>Review questions completed</dt>
            <dd>{session.reviewCount}</dd>
          </div>
        </dl>
        {session.review && !patterns.length && (
          <p className="success-note">All saved patterns are mastered. What a lovely milestone!</p>
        )}
        <div className="button-row">
          <button className="button" onClick={again}>
            Practice Again →
          </button>
          <Link className="button secondary" to="/statistics">
            View Statistics
          </Link>
        </div>
        <button
          className="text-button review-action"
          disabled={!patterns.length}
          onClick={() => navigate('/practice/setup', { state: { review: true } })}
        >
          Practice Mistakes ({patterns.length}) →
        </button>
        {!patterns.length && (
          <p className="help">No active mistakes to review. You’re all caught up!</p>
        )}
      </section>
      <div className="button-row centered">
        <Link className="text-link" to="/practice/setup">
          Change Settings
        </Link>
        <Link className="text-link" to="/">
          Return Home
        </Link>
      </div>
    </div>
  );
}
function MissingPage() {
  return (
    <>
      <PageTitle eyebrow="A LITTLE DETOUR" title="This path hasn’t grown yet." />
      <Link className="button" to="/">
        Return Home
      </Link>
    </>
  );
}
const router = createBrowserRouter([
  {
    element: (
      <AppProvider>
        <Layout />
      </AppProvider>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/practice/setup', element: <SetupPage /> },
      { path: '/practice/session', element: <PracticePage /> },
      { path: '/practice/summary', element: <SummaryPage /> },
      { path: '/statistics', element: <StatisticsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <MissingPage /> },
    ],
  },
]);
export default function App() {
  return <RouterProvider router={router} />;
}
