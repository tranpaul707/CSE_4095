import { callStatusAtStep } from '../algorithm/alternateCheckers';
import type { RecursiveCall, Swap } from '../types';

interface RecursiveTraceProps {
  calls: RecursiveCall[];
  currentStep: number;
  currentSwap: Swap | null;
}

export function RecursiveTrace({ calls, currentStep, currentSwap }: RecursiveTraceProps) {
  return (
    <section className="panel">
      <h2>Recursive Call Trace</h2>
      {calls.length === 0 ? (
        <p className="panel-empty">Generate a board to see recursive calls.</p>
      ) : (
        <ul className="trace-list">
          {calls.map((call) => {
            const status = callStatusAtStep(call, currentStep);
            const isHighlight =
              currentSwap?.callId === call.id ||
              (currentStep === 0 && call.id === 1) ||
              (status === 'active' && currentSwap == null && call.id === deepestActive(calls, currentStep));

            return (
              <li
                key={call.id}
                className={[
                  'trace-item',
                  `trace-item--${status}`,
                  isHighlight ? 'trace-item--highlight' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ paddingLeft: `${0.75 + call.depth * 1.1}rem` }}
              >
                <div className="trace-main">
                  <span className="trace-id">#{call.id}</span>
                  {status === 'base' ? (
                    <span className="trace-fn">Base Case</span>
                  ) : (
                    <span className="trace-fn">
                      alternate_checkers(i={call.index})
                    </span>
                  )}
                  <span className={`trace-status status-${status}`}>{status}</span>
                </div>
                <div className="trace-meta">
                  <span>depth {call.depth}</span>
                  {call.pair && (
                    <span>
                      pair [{call.pair[0]}, {call.pair[1]}]
                    </span>
                  )}
                  {call.swapIds.length > 0 && (
                    <span>
                      swaps {call.swapIds.map((id) => `#${id}`).join(', ')}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function deepestActive(calls: RecursiveCall[], currentStep: number): number | null {
  let best: RecursiveCall | null = null;
  for (const call of calls) {
    const status = callStatusAtStep(call, currentStep);
    if (status === 'active' || status === 'base') {
      if (!best || call.depth > best.depth) best = call;
    }
  }
  return best?.id ?? null;
}
