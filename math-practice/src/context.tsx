import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppState } from './types';
import { initialState, load, PREFIX, save } from './store';
type Change = (state: AppState) => AppState;
const AppContext = createContext<{
  state: AppState;
  change: (update: Change) => void;
  clearAll: () => void;
  isSessionActive: () => boolean;
  warning: string;
  dismissWarning: () => void;
} | null>(null);
function readInitial() {
  try {
    return load(window.localStorage);
  } catch {
    return {
      state: initialState(),
      warning: 'Browser storage is unavailable. Your progress will stay in this tab only.',
    };
  }
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitial);
  const [state, setState] = useState(initial.state);
  const [warning, setWarning] = useState(initial.warning);
  const current = useRef(state);
  const dirty = useRef(false);
  const protectedVersion = useRef(initial.warning.includes('different version'));
  const change = useCallback((update: Change) => {
    const previous = current.current;
    const next = update(previous);
    if (next === previous) return;
    current.current = next;
    setState(next);
    try {
      if (!protectedVersion.current) {
        const error = save(window.localStorage, next, dirty.current ? undefined : previous);
        dirty.current = !!error;
        if (error) setWarning(error);
      }
    } catch {
      dirty.current = true;
      setWarning('Progress is available in this tab, but your browser could not save it.');
    }
  }, []);
  function clearAll() {
    protectedVersion.current = false;
    try {
      for (const key of [
        'settings',
        'attempts',
        'sessions',
        'mistakePatterns',
        'statistics',
        'activeSession',
        'summary',
        'version',
      ])
        window.localStorage.removeItem(PREFIX + key);
      window.localStorage.removeItem('math-meadow:v1');
    } catch {
      setWarning('Browser storage could not be cleared. The data in this tab has been reset.');
    }
    change(initialState);
  }
  const isSessionActive = useCallback(() => current.current.active !== null, []);
  return (
    <AppContext.Provider
      value={{
        state,
        change,
        clearAll,
        isSessionActive,
        warning,
        dismissWarning: () => setWarning(''),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('Missing application provider');
  return value;
}
