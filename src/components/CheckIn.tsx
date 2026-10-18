import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, SunMoon } from 'lucide-react';
import type { Energy } from '../state/tasks';
import { useGentle } from './gentle';

const TILES: { e: Energy; label: string; caption: string; Icon: typeof Sun }[] = [
  { e: 'good', label: 'Good', caption: 'A full tank', Icon: Sun },
  { e: 'okay', label: 'Okay', caption: 'Some, not lots', Icon: SunMoon },
  { e: 'low', label: 'Low', caption: 'Barely any, and that’s okay', Icon: Moon },
];

function Tile({ e, label, caption, Icon, onChoose, focusFirst }: {
  e: Energy;
  label: string;
  caption: string;
  Icon: typeof Sun;
  onChoose: (e: Energy) => void;
  focusFirst?: boolean;
}) {
  const gentle = useGentle();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusFirst) ref.current?.focus();
  }, [focusFirst]);
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => onChoose(e)}
      whileTap={gentle ? undefined : { scale: 0.98 }}
      className="tile glass"
    >
      <span className="tile-icon glass inline-flex rounded-full p-5" aria-hidden="true">
        <Icon className="h-9 w-9" style={{ color: 'var(--ink)' }} />
      </span>
      <span className="font-display text-2xl">
        {label}
        <span className="sr-only"> energy,</span>
      </span>
      <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        {caption}
      </span>
    </motion.button>
  );
}

export function CheckIn({ last, onChoose }: { last: Energy | null; onChoose: (e: Energy) => void }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLine = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
    >
      <div className="w-full max-w-3xl py-10 text-center">
        <p className="text-sm font-medium tracking-wide" style={{ color: 'var(--ink-soft)' }}>
          {dateLine}
        </p>
        <h1 id="checkin-title" className="font-display mt-3 text-4xl leading-tight sm:text-6xl">
          {greeting}.
          <br />
          How much energy do you have today?
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base" style={{ color: 'var(--ink-soft)' }}>
          Whatever you choose, the list adjusts to fit. Nothing is ever lost.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {TILES.map((t, i) => (
            <Tile key={t.e} {...t} onChoose={onChoose} focusFirst={i === 0} />
          ))}
        </div>
        {last && (
          <p className="mt-8 text-sm" style={{ color: 'var(--ink-soft)' }}>
            Last time you checked in as {last}. Press Escape to keep it.
          </p>
        )}
      </div>
    </motion.div>
  );
}
