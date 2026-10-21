import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { DifficultySelector, Metrics, OperationSelector } from '../src/components';
import type { Difficulty, Operation } from '../src/types';
it('operation selection is accessible, supports multiple choices and select-all', async () => {
  function Harness() { const [value, setValue] = useState<Operation[]>([]); return <OperationSelector value={value} onChange={setValue} />; }
  render(<Harness />); const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Addition' }));
  await user.click(screen.getByRole('button', { name: 'Division' }));
  expect(screen.getByRole('button', { name: 'Addition' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Division' })).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: /Select all/ }));
  expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(4);
});
it('difficulty selection switches among the four official levels', async () => {
  function Harness() { const [value, setValue] = useState<Difficulty>(1); return <DifficultySelector value={value} onChange={setValue} />; }
  render(<Harness />); const user = userEvent.setup();
  await user.click(screen.getByRole('radio', { name: /Advanced/ }));
  expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked();
  expect(screen.getByRole('radio', { name: /Beginner/ })).not.toBeChecked();
});
it('statistics use explicit labels and a zero-safe percentage', () => {
  const { rerender } = render(<Metrics value={{ attempted: 0, correct: 0, incorrect: 0 }} />);
  expect(screen.getByText('0%')).toBeInTheDocument();
  rerender(<Metrics value={{ attempted: 5, correct: 4, incorrect: 1 }} />);
  expect(screen.getByText('80%')).toBeInTheDocument();
  expect(screen.getByText('Incorrect')).toBeInTheDocument();
});
