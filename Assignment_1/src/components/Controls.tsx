interface ControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isAnimating: boolean;
  onStart: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onPlay: () => void;
  onReset: () => void;
}

export function Controls({
  currentStep,
  totalSteps,
  isPlaying,
  isAnimating,
  onStart,
  onPrevious,
  onNext,
  onPlay,
  onReset,
}: ControlsProps) {
  const atStart = currentStep === 0;
  const atEnd = currentStep >= totalSteps;
  const busy = isAnimating;

  return (
    <div className="controls">
      <div className="controls-buttons">
        <button type="button" onClick={onStart} disabled={busy || isPlaying || totalSteps === 0}>
          Start
        </button>
        <button type="button" onClick={onPrevious} disabled={busy || atStart || isPlaying}>
          Previous
        </button>
        <button type="button" onClick={onNext} disabled={busy || atEnd || isPlaying}>
          Next
        </button>
        <button
          type="button"
          className={isPlaying ? 'btn-accent' : ''}
          onClick={onPlay}
          disabled={(busy && !isPlaying) || (atEnd && !isPlaying) || totalSteps === 0}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={onReset} disabled={busy && !isPlaying}>
          Reset
        </button>
      </div>
      <div className="step-indicator">
        <span>
          Step {currentStep} / {totalSteps}
        </span>
        <span>
          Adjacent Swaps: {currentStep} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
