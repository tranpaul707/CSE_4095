interface StatisticsProps {
  n: number;
  recursiveCalls: number;
  totalSwaps: number;
  currentStep: number;
}

export function Statistics({
  n,
  recursiveCalls,
  totalSwaps,
  currentStep,
}: StatisticsProps) {
  return (
    <section className="panel stats-panel">
      <h2>Statistics</h2>
      <dl className="stats-grid">
        <div>
          <dt>n</dt>
          <dd>{n}</dd>
        </div>
        <div>
          <dt>Total Checkers</dt>
          <dd>{2 * n}</dd>
        </div>
        <div>
          <dt>Recursive Calls</dt>
          <dd>{recursiveCalls}</dd>
        </div>
        <div>
          <dt>Adjacent Swaps</dt>
          <dd>{totalSwaps}</dd>
        </div>
        <div>
          <dt>Current Step</dt>
          <dd>
            {currentStep} / {totalSwaps}
          </dd>
        </div>
        <div>
          <dt>Expected Swaps</dt>
          <dd>
            n(n−1)/2 = {(n * (n - 1)) / 2}
          </dd>
        </div>
      </dl>
    </section>
  );
}
