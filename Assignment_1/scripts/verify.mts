import {
  expectedSwapCount,
  generateSolution,
} from '../src/algorithm/alternateCheckers.ts';

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('ok:', msg);
  }
}

for (const n of [1, 2, 3, 5]) {
  const s = generateSolution(n);
  const expected = expectedSwapCount(n);
  const final = s.boardHistory.at(-1)!;

  assert(s.initialBoard.join(',') === [...Array(n).fill(0), ...Array(n).fill(1)].join(','), `n=${n} initial`);
  assert(final.every((v, i) => v === i % 2), `n=${n} final alternating`);
  assert(s.swaps.length === expected, `n=${n} swap count ${s.swaps.length}==${expected}`);
  assert(s.boardHistory.length === expected + 1, `n=${n} history length`);
  assert(
    s.swaps.every((sw) => Math.abs(sw.leftIndex - sw.rightIndex) === 1),
    `n=${n} all adjacent`,
  );

  // Each history step differs from previous by exactly one adjacent swap.
  for (let i = 1; i < s.boardHistory.length; i++) {
    const prev = s.boardHistory[i - 1];
    const curr = s.boardHistory[i];
    const sw = s.swaps[i - 1];
    const diffs: number[] = [];
    for (let j = 0; j < prev.length; j++) {
      if (prev[j] !== curr[j]) diffs.push(j);
    }
    assert(
      diffs.length === 2 &&
        diffs.includes(sw.leftIndex) &&
        diffs.includes(sw.rightIndex) &&
        prev[sw.leftIndex] === curr[sw.rightIndex] &&
        prev[sw.rightIndex] === curr[sw.leftIndex],
      `n=${n} history step ${i} matches swap`,
    );
  }
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nAll acceptance checks passed.');
