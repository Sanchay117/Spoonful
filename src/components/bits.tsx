import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Effort } from '../state/tasks';
import { effortLabel } from '../state/tasks';
import { useGentle } from './gentle';

export function EffortPill({ effort }: { effort: Effort }) {
  return (
    <span className={`pill pill-${effort}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} aria-hidden="true" />
      {effortLabel[effort]}
    </span>
  );
}

export function SpoonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="spoon-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2557" />
          <stop offset="1" stopColor="#4a2e52" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#spoon-bg)" />
      <ellipse cx="32" cy="22" rx="8.8" ry="10.8" fill="#f6e7d3" />
      <rect x="29.6" y="28.5" width="4.8" height="21" rx="2.4" fill="#f6e7d3" />
    </svg>
  );
}

export function GentleNote({ children }: { children: ReactNode }) {
  const gentle = useGentle();
  return (
    <motion.p
      initial={{ opacity: 0, y: gentle ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: gentle ? 0.25 : 0.45, ease: 'easeOut' }}
      className="mt-5 text-center font-display text-xl sm:text-2xl"
      style={{ color: 'var(--ink-soft)' }}
    >
      {children}
    </motion.p>
  );
}

export function EmptyState() {
  return (
    <div className="glass mt-2 flex flex-col items-center gap-3 rounded-3xl px-8 py-14 text-center">
      <span className="glass inline-flex rounded-full p-5" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.24 12.24a6 6 0 0 1-8.49-8.49A7 7 0 1 0 20.24 12.24z" />
        </svg>
      </span>
      <p className="font-display text-2xl">All clear.</p>
      <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        Nothing needs you right now. Add something gentle if you’d like.
      </p>
    </div>
  );
}
