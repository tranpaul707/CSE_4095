interface ArrayDisplayProps {
  board: number[];
}

export function ArrayDisplay({ board }: ArrayDisplayProps) {
  return (
    <div className="array-display">
      <h3>Current Array</h3>
      <code className="array-code">[{board.join(', ')}]</code>
    </div>
  );
}
