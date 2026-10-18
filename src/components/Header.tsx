import { Moon, Sparkles, Sun, SunMoon, Waves } from 'lucide-react';
import type { Energy } from '../state/tasks';
import { SpoonMark } from './bits';

const ENERGIES: { e: Energy; label: string; Icon: typeof Sun }[] = [
  { e: 'good', label: 'Good', Icon: Sun },
  { e: 'okay', label: 'Okay', Icon: SunMoon },
  { e: 'low', label: 'Low', Icon: Moon },
];

function EnergySwitch({ energy, onChange }: { energy: Energy; onChange: (e: Energy) => void }) {
  return (
    <fieldset className="glass flex items-center gap-1 rounded-full p-1.5">
      <legend className="sr-only">Energy level</legend>
      {ENERGIES.map(({ e, label, Icon }) => (
        <label key={e} className="cursor-pointer">
          <input type="radio" name="energy" className="sr-only" checked={energy === e} onChange={() => onChange(e)} />
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
              energy === e ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={
              energy === e
                ? { background: 'var(--glass-strong)', color: 'var(--ink)' }
                : { color: 'var(--ink-soft)' }
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{label} energy</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function Header({
  energy,
  onEnergy,
  calm,
  onCalm,
  onDemo,
  onCompare,
}: {
  energy: Energy;
  onEnergy: (e: Energy) => void;
  calm: boolean;
  onCalm: () => void;
  onDemo: () => void;
  onCompare: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 pb-3 pt-5 sm:px-8">
      <div className="flex items-center gap-2.5">
        <SpoonMark className="h-8 w-8 rounded-[10px]" />
        <h1 className="font-display text-[26px] italic leading-none">Spoonful</h1>
        <span className="hidden text-xs font-medium tracking-wide md:inline" style={{ color: 'var(--ink-soft)' }}>
          only what fits today
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <EnergySwitch energy={energy} onChange={onEnergy} />
        <button
          type="button"
          className="btn btn-soft h-12 gap-2 px-4 text-sm"
          onClick={onCalm}
          aria-pressed={calm}
          aria-label={calm ? 'Calm mode is on. Turn ambient motion back on.' : 'Calm mode: turn off ambient motion'}
        >
          <Waves className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Calm</span>
        </button>
        <button type="button" className="btn btn-soft h-12 gap-2 px-4 text-sm" onClick={onDemo}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Demo day</span>
        </button>
        <button type="button" className="btn btn-soft h-12 gap-2 px-4 text-sm" onClick={onCompare}>
          Compare
          <kbd className="kbd">C</kbd>
        </button>
      </div>
    </header>
  );
}
