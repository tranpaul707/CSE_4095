let audio: AudioContext | null = null;
export async function playSound(kind: 'flip' | 'correct' | 'incorrect') {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') await audio.resume();
    const notes = kind === 'correct' ? [523, 659] : kind === 'incorrect' ? [440, 330] : [600];
    notes.forEach((frequency, i) => {
      const oscillator = audio!.createOscillator(),
        gain = audio!.createGain();
      const start = audio!.currentTime + i * 0.13;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      oscillator.connect(gain);
      gain.connect(audio!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.24);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  } catch {
    /* Unsupported or blocked audio must never prevent practice. */
  }
}
