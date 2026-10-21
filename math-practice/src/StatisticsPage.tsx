import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from './context';
import { ConfirmDialog, EmptyState, Metrics, PageTitle } from './components';
import { DIFFICULTIES, expression, LEVELS, OPERATIONS, OPS } from './math';
import { accuracy, activePatterns, resetHistory, totalsFor } from './store';
export default function StatisticsPage() {
  const { state, change } = useApp();
  const [reset, setReset] = useState(false),
    [showMastered, setShowMastered] = useState(false);
  const { attempts, archive } = state;
  const totals = useMemo(() => totalsFor({ attempts, archive }), [attempts, archive]);
  const missed = Math.max(0, ...OPS.map((op) => totals.byOperation[op].incorrect));
  const frequentlyMissed = OPS.filter((op) => totals.byOperation[op].incorrect === missed);
  const sorted = [...state.patterns].sort((a, b) => b.incorrectCount - a.incorrectCount);
  const visible = sorted.filter((p) => p.mastered === showMastered);
  const open = activePatterns(state).length;
  return (
    <>
      <PageTitle eyebrow="EVERY STEP ADDS UP" title="See your progress grow.">
        A little look at what you’ve learned—and what comes next.
      </PageTitle>
      {!totals.attempted && (
        <EmptyState title="Your story starts with one question.">
          Complete some practice and your progress will grow here.{' '}
          <Link to="/practice/setup">Let’s begin →</Link>
        </EmptyState>
      )}
      <section className="panel stats-overview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE BIG PICTURE</span>
            <h2>Overall performance</h2>
          </div>
          <span className="panel-flower" aria-hidden="true">
            ✳
          </span>
        </div>
        <Metrics value={totals} label="Overall performance" />
        <p className="help">
          Results reflect your “I Got It Right” and “I Got It Wrong” reports, including mistake
          review.
        </p>
      </section>
      <section className="stats-section">
        <div className="section-heading">
          <h2>By operation</h2>
          <span className="help">A different way to grow</span>
        </div>
        <div className="stats-grid">
          {OPS.map((op) => (
            <article className={`panel statistic-card ${OPERATIONS[op].color}`} key={op}>
              <h3>
                <span className="mini-symbol" aria-hidden="true">
                  {OPERATIONS[op].symbol}
                </span>
                {OPERATIONS[op].name}
              </h3>
              <Metrics value={totals.byOperation[op]} label={`${OPERATIONS[op].name} results`} />
            </article>
          ))}
        </div>
      </section>
      <section className="stats-section">
        <h2>By difficulty</h2>
        <div className="stats-grid">
          {DIFFICULTIES.map((level) => (
            <article className="panel statistic-card" key={level}>
              <h3>
                <span className="level-label">LEVEL {level}</span> {LEVELS[level].name}
              </h3>
              <Metrics value={totals.byDifficulty[level]} label={`${LEVELS[level].name} results`} />
            </article>
          ))}
        </div>
      </section>
      <section className="panel stats-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TURNING NOT YET INTO I CAN</span>
            <h2>Mistake review</h2>
          </div>
          <Link className="text-link" to="/practice/setup" state={{ review: true }}>
            {open ? 'Practice Mistakes →' : 'Start Practice →'}
          </Link>
        </div>
        <dl className="metrics review-metrics">
          <div>
            <dt>Active patterns</dt>
            <dd>{open}</dd>
          </div>
          <div>
            <dt>Mastered patterns</dt>
            <dd>{state.patterns.length - open}</dd>
          </div>
          <div>
            <dt>Similar questions practiced</dt>
            <dd>{totals.reviewCount}</dd>
          </div>
          <div>
            <dt>Review answers correct</dt>
            <dd>{totals.reviewCorrect}</dd>
          </div>
        </dl>
        <p className="help">
          {missed
            ? `Most frequently missed: ${frequentlyMissed.map((op) => OPERATIONS[op].name).join(', ')} (${missed} self-reported mistakes each).`
            : 'No missed areas yet. Every answer helps you discover what to practice.'}
        </p>
        <h3>Frequently missed number facts</h3>
        {sorted.length ? (
          <ul className="fact-list">
            {sorted.slice(0, 5).map((p) => (
              <li key={p.id}>
                <strong>
                  {expression(p.question)} = {p.question.correctAnswer}
                </strong>
                <span>
                  {p.incorrectCount} missed · {p.mastered ? 'Mastered' : 'Growing'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="help">Saved mistakes will appear here after practice.</p>
        )}
        <div className="section-heading">
          <h3>Mistake details</h3>
          <div className="segmented compact">
            <button aria-pressed={!showMastered} onClick={() => setShowMastered(false)}>
              Active ({open})
            </button>
            <button aria-pressed={showMastered} onClick={() => setShowMastered(true)}>
              Mastered ({state.patterns.length - open})
            </button>
          </div>
        </div>
        {visible.length ? (
          <div className="pattern-grid">
            {visible.map((p) => (
              <article className="pattern" key={p.id}>
                <strong>
                  {expression(p.question)} = {p.question.correctAnswer}
                </strong>
                <span>
                  {LEVELS[p.question.difficulty].name} · {p.incorrectCount} missed
                </span>
                <span>
                  {p.similarCorrectCount} / {state.settings.masteryThreshold} successful reviews{' '}
                  {p.mastered ? '✓ Mastered' : ''}
                </span>
                <progress
                  aria-label={`Mastery for ${expression(p.question)}`}
                  value={Math.min(p.similarCorrectCount, state.settings.masteryThreshold)}
                  max={state.settings.masteryThreshold}
                />
                <span className="help">
                  Last missed {new Date(p.lastIncorrectAt).toLocaleDateString()}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="help">
            {showMastered
              ? 'Your mastered patterns will bloom here.'
              : 'No active mistakes. A lovely place to be!'}
          </p>
        )}
      </section>
      <section className="panel stats-section">
        <h2>Recent sessions</h2>
        {state.sessions.length ? (
          <div className="session-list">
            {state.sessions.slice(0, 20).map((session) => (
              <article key={session.id}>
                <div>
                  <strong>{`${session.review ? 'Review: ' : ''}${(session.practicedOperations || session.operations).map((op) => OPERATIONS[op].name).join(' + ') || 'No questions recorded'}`}</strong>
                  <p className="help">
                    {new Date(session.completedAt!).toLocaleString()} ·{' '}
                    {(session.practicedDifficulties || [session.difficulty])
                      .map((level) => LEVELS[level].name)
                      .join(', ') || LEVELS[session.difficulty].name}
                  </p>
                </div>
                <dl className="recent-metrics">
                  <div>
                    <dt>Attempted</dt>
                    <dd>{session.attempted}</dd>
                  </div>
                  <div>
                    <dt>Correct</dt>
                    <dd>{session.correct}</dd>
                  </div>
                  <div>
                    <dt>Incorrect</dt>
                    <dd>{session.incorrect}</dd>
                  </div>
                  <div>
                    <dt>Accuracy</dt>
                    <dd>{accuracy(session)}%</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="help">Finish a session to see it here.</p>
        )}
        <p className="help">
          Showing up to 20 recent sessions. Lifetime totals include older practice.
        </p>
      </section>
      <div className="reset-row">
        <p className="help">Want a fresh start? Your settings can stay.</p>
        <button className="text-button destructive" onClick={() => setReset(true)}>
          Reset Statistics
        </button>
      </div>
      {reset && (
        <ConfirmDialog
          title="Reset your practice history?"
          confirmLabel="Reset Statistics"
          onCancel={() => setReset(false)}
          onConfirm={() => {
            change(resetHistory);
            setReset(false);
          }}
        >
          Are you sure you want to erase all practice history and statistics? Mistake patterns and
          any unfinished session will also be cleared. Your settings will stay.
        </ConfirmDialog>
      )}
    </>
  );
}
