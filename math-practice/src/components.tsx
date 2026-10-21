import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { LEVELS, OPERATIONS } from './math';
import type { Counts, Difficulty, Operation } from './types';
import { accuracy } from './store';
export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title">{title}</h2>
      <p>{children}</p>
      <div className="button-row">
        <button autoFocus className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
export function OperationSelector({
  value,
  onChange,
}: {
  value: Operation[];
  onChange: (ops: Operation[]) => void;
}) {
  return (
    <fieldset>
      <legend>What shall we practice?</legend>
      <div className="operation-grid">
        {Object.entries(OPERATIONS).map(([key, op]) => {
          const operation = key as Operation,
            checked = value.includes(operation);
          return (
            <button
              type="button"
              key={key}
              aria-pressed={checked}
              className={`operation ${op.color} ${checked ? 'selected' : ''}`}
              onClick={() =>
                onChange(checked ? value.filter((v) => v !== operation) : [...value, operation])
              }
            >
              <span className="op-symbol" aria-hidden="true">
                {op.symbol}
              </span>
              <strong>{op.name}</strong>
              <span className="selection-mark" aria-hidden="true">
                {checked ? '✓' : '+'}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="text-button"
        onClick={() => onChange(Object.keys(OPERATIONS) as Operation[])}
      >
        Select all · mixed practice
      </button>
    </fieldset>
  );
}
export function DifficultySelector({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (level: Difficulty) => void;
}) {
  return (
    <fieldset>
      <legend>Choose your challenge</legend>
      <div className="difficulty-grid">
        {([1, 2, 3, 4] as Difficulty[]).map((level) => (
          <label key={level} className={`difficulty ${value === level ? 'selected' : ''}`}>
            <input
              type="radio"
              name="difficulty"
              checked={value === level}
              onChange={() => onChange(level)}
            />
            <span className="level-label">LEVEL {level}</span>
            <strong>{LEVELS[level].name}</strong>
            <span>{LEVELS[level].description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function Metrics({ value, label = 'Practice results' }: { value: Counts; label?: string }) {
  return (
    <dl className="metrics" aria-label={label}>
      {[
        ['Attempted', value.attempted],
        ['Correct', value.correct],
        ['Incorrect', value.incorrect],
        ['Accuracy', `${accuracy(value)}%`],
      ].map(([name, number]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{number}</dd>
        </div>
      ))}
    </dl>
  );
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        ✳
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function Garden() {
  return (
    <svg
      className="garden"
      viewBox="0 0 440 360"
      role="img"
      aria-label="A garden of growing number skills"
    >
      <circle cx="240" cy="170" r="145" fill="#e5ecdb" />
      <circle cx="355" cy="63" r="24" fill="#f2ca63" />
      <path d="M50 318 Q220 290 400 320" stroke="#bdcdb9" strokeWidth="3" fill="none" />
      <path
        d="M220 280V138M220 225Q145 225 147 170Q210 163 220 225M220 197Q282 193 281 133Q226 136 220 197"
        stroke="#245c49"
        strokeWidth="7"
        fill="#80a986"
        strokeLinecap="round"
      />
      <path d="M178 263H263L253 317H188Z" fill="#d58f6b" />
      <path d="M176 262H266V274H176Z" fill="#b87251" />
      <g transform="translate(220 107)">
        <ellipse rx="24" ry="44" fill="#f2ca63" />
        <ellipse rx="24" ry="44" fill="#f2ca63" transform="rotate(60)" />
        <ellipse rx="24" ry="44" fill="#f2ca63" transform="rotate(120)" />
        <circle r="25" fill="#f8f7f0" />
        <text textAnchor="middle" y="10" fontSize="32" fill="#245c49">
          +
        </text>
      </g>
      <g transform="rotate(-10 97 116)">
        <rect x="45" y="77" width="97" height="70" rx="17" fill="#fff" stroke="#d8dcca" />
        <text x="94" y="123" textAnchor="middle" fill="#245c49" fontSize="31" fontWeight="700">
          7 × 8
        </text>
      </g>
      <g transform="rotate(10 345 230)">
        <rect x="300" y="192" width="89" height="67" rx="17" fill="#eadff5" />
        <text x="344" y="237" textAnchor="middle" fill="#55436b" fontSize="32" fontWeight="700">
          56
        </text>
      </g>
      <path
        d="M94 304V264M94 282Q60 276 66 253Q95 252 94 282M94 280Q121 272 125 250Q97 247 94 280"
        stroke="#538765"
        strokeWidth="5"
        fill="#9eb99b"
      />
    </svg>
  );
}
