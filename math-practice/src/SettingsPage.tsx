import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { ConfirmDialog, DifficultySelector, OperationSelector, PageTitle } from './components';
import { updateSettings } from './store';
import type { SessionLength, Settings } from './types';
import { playSound } from './sound';
export default function SettingsPage() {
  const { state, change, clearAll } = useApp(), navigate = useNavigate();
  const [clearing, setClearing] = useState(false), [notice, setNotice] = useState('');
  const settings = state.settings;
  function update(patch: Partial<Settings>) { change(s => updateSettings(s, { ...s.settings, ...patch })); setNotice('Settings saved for this browser.'); }
  return <><PageTitle eyebrow="MAKE YOURSELF AT HOME" title="A little more you.">Choose what helps you learn. Your preferences save automatically.</PageTitle><div className="settings-layout"><div><section className="panel"><h2>Your practice preferences</h2>{([
    ['sound', 'Sound effects', 'Gentle sounds for flips and results.'],
    ['animation', 'Card animation', 'A small flip when the answer is revealed.'],
    ['explanations', 'Show explanations', 'A little help understanding each answer.'],
    ['feedback', 'Encouraging feedback messages', 'A moment to celebrate effort before the next question.'],
  ] as const).map(([key, title, description]) => <label className="toggle-row" key={key}><span><strong>{title}</strong><span>{description}</span></span><input type="checkbox" checked={settings[key]} onChange={e => update({ [key]: e.target.checked })} /></label>)}{settings.sound && <button className="text-button" onClick={() => void playSound('correct')}>Try a sound ♪</button>}<label className="mastery-setting"><span><strong>Successful reviews to master a pattern</strong><span className="help">Choose 1–10. Default: 3. A new mistake starts its progress over.</span></span><select value={settings.masteryThreshold} onChange={e => update({ masteryThreshold: Number(e.target.value) })}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></label><p className="help">Your device’s reduced-motion preference always takes priority over animations.</p></section>
    <section className="panel settings-defaults"><h2>Your practice defaults</h2><OperationSelector value={settings.defaultOperations} onChange={operations => { if (operations.length) update({ defaultOperations: operations }); else setNotice('Keep at least one default operation selected.'); }} /><DifficultySelector value={settings.defaultDifficulty} onChange={defaultDifficulty => update({ defaultDifficulty })} /><label className="select-label">Default session length<select value={settings.defaultLength} onChange={e => update({ defaultLength: e.target.value === 'continuous' ? 'continuous' : Number(e.target.value) as SessionLength })}><option value={5}>5 questions</option><option value={10}>10 questions</option><option value={20}>20 questions</option><option value="continuous">Continuous practice</option></select></label></section><p className="saved-notice" role="status">{notice || 'Preferences are saved automatically.'}</p></div>
    <aside><section className="panel privacy-panel"><span className="aside-flower" aria-hidden="true">✳</span><h2>Your progress.<br />Your space.</h2><p>No accounts. No ads. No tracking. Your practice history stays in this browser on this device.</p><p>Progress doesn’t sync between browsers or devices. Clearing browser data or using private browsing may remove it.</p></section><section className="panel clear-panel"><h2>A completely fresh start</h2><p>Clear settings, history, mistakes, and any unfinished practice.</p><button className="text-button destructive" onClick={() => setClearing(true)}>Clear All Application Data</button></section></aside></div>
    {clearing && <ConfirmDialog title="Clear all application data?" confirmLabel="Clear All Data" onCancel={() => setClearing(false)} onConfirm={() => { clearAll(); setClearing(false); navigate('/'); }}>This permanently clears your settings, practice history, statistics, saved mistakes, and unfinished session in this browser. This action cannot be undone.</ConfirmDialog>}
  </>;
}
