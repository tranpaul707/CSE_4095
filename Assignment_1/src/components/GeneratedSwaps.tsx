import type { RecursiveCall, Swap } from '../types';

interface GeneratedSwapsProps {
  calls: RecursiveCall[];
  swaps: Swap[];
  currentStep: number;
}

export function GeneratedSwaps({ calls, swaps, currentStep }: GeneratedSwapsProps) {
  const currentSwapId = currentStep > 0 ? swaps[currentStep - 1]?.id ?? null : null;
  const root = calls.find((c) => c.parentId === undefined);

  return (
    <section className="panel">
      <h2>Generated Swaps</h2>
      {calls.length === 0 ? (
        <p className="panel-empty">Generate a board to see swaps.</p>
      ) : swaps.length === 0 ? (
        <p className="panel-empty">No adjacent swaps needed for this n.</p>
      ) : root ? (
        <pre className="swap-tree">
          <CallBranch
            call={root}
            calls={calls}
            swaps={swaps}
            currentSwapId={currentSwapId}
            indent=""
            isLast={true}
            isRoot={true}
          />
        </pre>
      ) : null}
    </section>
  );
}

interface BranchProps {
  call: RecursiveCall;
  calls: RecursiveCall[];
  swaps: Swap[];
  currentSwapId: number | null;
  indent: string;
  isLast: boolean;
  isRoot: boolean;
}

function CallBranch({
  call,
  calls,
  swaps,
  currentSwapId,
  indent,
  isLast,
  isRoot,
}: BranchProps) {
  const children = calls.filter((c) => c.parentId === call.id);
  const callSwaps = swaps.filter((s) => s.callId === call.id);

  const label =
    call.status === 'base'
      ? `Call #${call.id}: Base Case (i=${call.index})`
      : `Call #${call.id}: alternate_checkers(i=${call.index})`;

  const connector = isRoot ? '' : isLast ? '└── ' : '├── ';
  const childIndent = isRoot ? '' : indent + (isLast ? '    ' : '│   ');

  type Item =
    | { type: 'swap'; swap: Swap }
    | { type: 'call'; child: RecursiveCall };

  const items: Item[] = [
    ...callSwaps.map((swap) => ({ type: 'swap' as const, swap })),
    ...children.map((child) => ({ type: 'call' as const, child })),
  ];

  return (
    <>
      <div className="swap-tree-line">
        <span className="swap-tree-indent">{indent + connector}</span>
        <span>{label}</span>
      </div>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        if (item.type === 'swap') {
          const active = item.swap.id === currentSwapId;
          const branch = last ? '└── ' : '├── ';
          return (
            <div
              key={`s-${item.swap.id}`}
              className={`swap-tree-line${active ? ' swap-tree-line--active' : ''}`}
            >
              <span className="swap-tree-indent">{childIndent + branch}</span>
              <span>
                Swap #{item.swap.id}: index {item.swap.leftIndex} ↔ {item.swap.rightIndex}
              </span>
            </div>
          );
        }
        return (
          <CallBranch
            key={`c-${item.child.id}`}
            call={item.child}
            calls={calls}
            swaps={swaps}
            currentSwapId={currentSwapId}
            indent={childIndent}
            isLast={last}
            isRoot={false}
          />
        );
      })}
    </>
  );
}
