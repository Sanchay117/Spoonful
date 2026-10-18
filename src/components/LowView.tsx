import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Moon, Sunrise } from 'lucide-react';
import type { Task } from '../state/tasks';
import { useGentle } from './gentle';
import { EffortPill, GentleNote } from './bits';

const spring = { type: 'spring', stiffness: 170, damping: 24 } as const;

function FocusCard({ task, onDone, onNotToday }: {
  task: Task;
  onDone: (id: string) => void;
  onNotToday: (id: string) => void;
}) {
  const gentle = useGentle();
  const [leaving, setLeaving] = useState<null | 'done' | 'notToday'>(null);
  const [bloom, setBloom] = useState(false);

  const exit =
    leaving === 'notToday'
      ? gentle
        ? { opacity: 0, transition: { duration: 0.25 } }
        : { opacity: 0, x: 110, rotate: 1.2, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const } }
      : gentle
        ? { opacity: 0, transition: { duration: 0.25 } }
        : { opacity: 0, scale: 0.96, filter: 'blur(6px)', transition: { duration: 0.5, ease: 'easeOut' } };

  return (
    <motion.div
      data-task-card
      layoutId={`task-${task.id}`}
      exit={exit}
      initial={{ opacity: 0, scale: gentle ? 1 : 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={gentle ? { duration: 0.3 } : spring}
      className="glass glow-card relative mt-4 overflow-hidden rounded-[2rem] px-7 py-10 text-center sm:px-12 sm:py-14"
    >
      {bloom && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: 'radial-gradient(circle at 50% 82%, var(--glow) 0%, transparent 60%)' }}
          initial={{ opacity: 0.95, scale: 0.3 }}
          animate={{ opacity: 0, scale: 1.25 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
      <EffortPill effort={task.effort} />
      <h2 className="font-display mt-4 text-3xl leading-snug sm:text-[44px]">{task.title}</h2>
      <p className="mt-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
        One thing is plenty today.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn btn-primary h-16 flex-1 text-lg"
          onClick={() => {
            setLeaving('done');
            setBloom(true);
            window.setTimeout(() => onDone(task.id), 300);
          }}
        >
          <Check className="h-5 w-5" aria-hidden="true" />
          Done
        </button>
        <button
          type="button"
          className="btn btn-soft h-16 flex-1 text-lg"
          onClick={() => {
            setLeaving('notToday');
            window.setTimeout(() => onNotToday(task.id), 60);
          }}
        >
          <Sunrise className="h-5 w-5" aria-hidden="true" />
          Not today
        </button>
      </div>
    </motion.div>
  );
}

function RestScreen() {
  const gentle = useGentle();
  return (
    <motion.div
      initial={{ opacity: 0, y: gentle ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: gentle ? 0.25 : 0.5, ease: 'easeOut' }}
      className="max-w-md text-center"
    >
      <span className="glass inline-flex rounded-full p-7" aria-hidden="true">
        <Moon className="h-10 w-10" style={{ color: 'var(--ink-soft)' }} />
      </span>
      <h2 className="font-display mt-7 text-4xl sm:text-5xl">Nothing needed today.</h2>
      <p className="mt-4 text-base" style={{ color: 'var(--ink-soft)' }}>
        Rest counts. The list will be here tomorrow, and so will you.
      </p>
    </motion.div>
  );
}

export function LowView({ task, note, onDone, onNotToday }: {
  task: Task | null;
  note: string | null;
  onDone: (id: string) => void;
  onNotToday: (id: string) => void;
}) {
  const gentle = useGentle();
  return (
    <motion.section
      data-view="low"
      className="absolute inset-0 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: gentle ? 0.25 : 0.4 } }}
      exit={{ opacity: 0, transition: { duration: gentle ? 0.25 : 0.6, ease: 'easeInOut' } }}
    >
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--ink-soft)' }}>
            Today’s one thing
          </p>
          <AnimatePresence mode="wait" initial={false}>
            {task ? (
              <FocusCard key={task.id} task={task} onDone={onDone} onNotToday={onNotToday} />
            ) : (
              <div key="rest" className="mt-4 flex justify-center">
                <RestScreen />
              </div>
            )}
          </AnimatePresence>
          <AnimatePresence>{note && <GentleNote key={note}>{note}</GentleNote>}</AnimatePresence>
          {task && (
            <p className="mt-8 text-center text-xs" style={{ color: 'var(--ink-soft)' }}>
              Everything else is resting quietly.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
