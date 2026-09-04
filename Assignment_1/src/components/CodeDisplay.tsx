const CODE = `def alternate_checkers(checkers, n, i=0):
    # Base case: no pair left to process
    if i >= 2 * n - 1:
        return

    # Current pair is two reds — bring the next black left
    if checkers[i] == 0 and checkers[i + 1] == 0:
        j = i + 2
        while checkers[j] == 0:
            j += 1

        # Bubble black left using only adjacent swaps
        while j > i + 1:
            checkers[j], checkers[j - 1] = checkers[j - 1], checkers[j]
            j -= 1

    # Recurse on the next pair (i + 2)
    alternate_checkers(checkers, n, i + 2)`;

export function CodeDisplay() {
  return (
    <section className="panel code-panel">
      <h2>Recursive Swap Function</h2>
      <ol className="code-notes">
        <li>Base case when <code>i</code> passes the last processable pair.</li>
        <li>Inspect the current pair <code>(checkers[i], checkers[i+1])</code>.</li>
        <li>If both are red, find the next black checker at index <code>j</code>.</li>
        <li>Move it left to <code>i+1</code> with adjacent swaps only.</li>
        <li>Recurse on the next pair at <code>i + 2</code>.</li>
      </ol>
      <pre className="code-block">
        <code>{CODE}</code>
      </pre>
    </section>
  );
}
