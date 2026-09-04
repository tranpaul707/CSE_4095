import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  expectedSwapCount,
  generateSolution,
} from './algorithm/alternateCheckers';
import { ArrayDisplay } from './components/ArrayDisplay';
import { Board } from './components/Board';
import { CodeDisplay } from './components/CodeDisplay';
import { Controls } from './components/Controls';
import { GeneratedSwaps } from './components/GeneratedSwaps';
import { RecursiveTrace } from './components/RecursiveTrace';
import { Statistics } from './components/Statistics';
import {
  MAX_N,
  PLAY_DELAY_MS,
  SWAP_ANIM_MS,
  type SolutionData,
  type Swap,
} from './types';
import './App.css';

type AnimDirection = 'forward' | 'backward';

export default function App() {
  const [inputN, setInputN] = useState(3);
  const [solution, setSolution] = useState<SolutionData>(() => generateSolution(3));
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSwap, setActiveSwap] = useState<Swap | null>(null);
  const [animDirection, setAnimDirection] = useState<AnimDirection>('forward');

  const animTimerRef = useRef<number | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const currentStepRef = useRef(0);
  const solutionRef = useRef(solution);
  const isPlayingRef = useRef(false);

  currentStepRef.current = currentStep;
  solutionRef.current = solution;

  const totalSteps = solution.swaps.length;
  const board = solution.boardHistory[currentStep] ?? solution.initialBoard;
  const completed =
    currentStep === totalSteps &&
    board.join(',') === solution.targetBoard.join(',');

  const clearTimers = useCallback(() => {
    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const resetVisualization = useCallback(
    (next: SolutionData) => {
      clearTimers();
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsAnimating(false);
      setActiveSwap(null);
      setCurrentStep(0);
      setSolution(next);
    },
    [clearTimers],
  );

  const handleGenerate = () => {
    const n = Math.floor(Number(inputN));
    if (!Number.isFinite(n) || n < 1) {
      window.alert('n must be a positive integer.');
      return;
    }
    if (n > MAX_N) {
      window.alert(`n must be at most ${MAX_N} (swaps grow as n(n−1)/2).`);
      return;
    }
    resetVisualization(generateSolution(n));
  };

  const animateToStep = useCallback((fromStep: number, toStep: number, onDone?: () => void) => {
    if (toStep === fromStep) {
      onDone?.();
      return;
    }

    const forward = toStep > fromStep;
    const swap = forward
      ? solutionRef.current.swaps[fromStep]
      : solutionRef.current.swaps[toStep];

    if (!swap) {
      setCurrentStep(toStep);
      onDone?.();
      return;
    }

    setCurrentStep(fromStep);
    setAnimDirection(forward ? 'forward' : 'backward');
    setActiveSwap(swap);
    setIsAnimating(true);

    animTimerRef.current = window.setTimeout(() => {
      setCurrentStep(toStep);
      setIsAnimating(false);
      setActiveSwap(null);
      animTimerRef.current = null;
      onDone?.();
    }, SWAP_ANIM_MS);
  }, []);

  const handleStart = () => {
    if (isAnimating || isPlaying || totalSteps === 0) return;
    clearTimers();

    if (currentStep === 0) {
      animateToStep(0, 1);
      return;
    }

    setCurrentStep(0);
    setActiveSwap(null);
    window.setTimeout(() => animateToStep(0, 1), 40);
  };

  const handlePrevious = () => {
    if (isAnimating || isPlaying || currentStep <= 0) return;
    animateToStep(currentStep, currentStep - 1);
  };

  const handleNext = () => {
    if (isAnimating || isPlaying || currentStep >= totalSteps) return;
    animateToStep(currentStep, currentStep + 1);
  };

  const playNext = useCallback(() => {
    const step = currentStepRef.current;
    const total = solutionRef.current.swaps.length;

    if (!isPlayingRef.current) return;

    if (step >= total) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    animateToStep(step, step + 1, () => {
      if (!isPlayingRef.current) return;
      const pause = Math.max(PLAY_DELAY_MS - SWAP_ANIM_MS, 150);
      playTimerRef.current = window.setTimeout(() => {
        playNext();
      }, pause);
    });
  }, [animateToStep]);

  const handlePlay = () => {
    if (isPlaying) {
      clearTimers();
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsAnimating(false);
      setActiveSwap(null);
      return;
    }

    if (isAnimating || currentStep >= totalSteps || totalSteps === 0) return;

    isPlayingRef.current = true;
    setIsPlaying(true);
    playNext();
  };

  const handleReset = () => {
    resetVisualization(generateSolution(solution.n));
    setInputN(solution.n);
  };

  const expected = useMemo(() => expectedSwapCount(solution.n), [solution.n]);

  const displaySwap =
    activeSwap ??
    (currentStep > 0 ? solution.swaps[currentStep - 1] ?? null : null);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">CSE 4095 · Assignment 1</p>
          <h1>Recursive Checker Visualizer</h1>
          <p className="subtitle">
            Watch adjacent swaps rearrange <code>[0]×n + [1]×n</code> into{' '}
            <code>[0, 1, 0, 1, …]</code> — one recursive call at a time.
          </p>
        </div>
      </header>

      <section className="input-bar">
        <label htmlFor="n-input">
          Number of Checkers (n)
          <span className="hint">1 – {MAX_N} · swaps = n(n−1)/2</span>
        </label>
        <div className="input-row">
          <input
            id="n-input"
            type="number"
            min={1}
            max={MAX_N}
            value={inputN}
            onChange={(e) => setInputN(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerate();
            }}
          />
          <button type="button" className="btn-primary" onClick={handleGenerate}>
            Generate Board
          </button>
        </div>
      </section>

      <section className="stage">
        <Board
          board={board}
          activeSwap={displaySwap}
          animating={isAnimating}
          animDirection={animDirection}
          completed={completed}
        />
        <ArrayDisplay board={board} />
        <Controls
          currentStep={currentStep}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          isAnimating={isAnimating}
          onStart={handleStart}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onPlay={handlePlay}
          onReset={handleReset}
        />
        {completed && (
          <p className="final-banner">
            Target reached · [{solution.targetBoard.join(', ')}] · {expected} adjacent
            swaps
          </p>
        )}
      </section>

      <div className="panels-row">
        <RecursiveTrace
          calls={solution.recursiveCalls}
          currentStep={currentStep}
          currentSwap={displaySwap}
        />
        <GeneratedSwaps
          calls={solution.recursiveCalls}
          swaps={solution.swaps}
          currentStep={currentStep}
        />
      </div>

      <Statistics
        n={solution.n}
        recursiveCalls={solution.recursiveCalls.length}
        totalSwaps={totalSteps}
        currentStep={currentStep}
      />

      <CodeDisplay />
    </div>
  );
}
