import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Moon, Mountain, Sunrise, Timer } from 'lucide-react';
import type { Effort, Task } from '../state/tasks';
import { useGentle } from './gentle';
import { EffortPill, GentleNote } from './bits';
import { ComingUp } from './ComingUp';
import { QuickAdd } from './QuickAdd';

const spring = { type: 'spring', stiffness: 170, damping: 24 } as const;

function FocusCard({
  task,
  onDone,
  onNotToday,
  onHarder,
  onAnnounce,
}: {
  task: Task;
  onDone: (id: string) => void;
  onNotToday: (id: string) => void;
  onHarder: (id: string) => void;
  onAnnounce: (msg: string) => void;
}) {
  const gentle = useGentle();
  const [leaving, setLeaving] = useState<null | 'done' | 'notToday'>(null);
  const [bloom, setBloom] = useState(false);
  const [cardMode, setCardMode] = useState<'normal' | 'timer' | 'started'>('normal');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(120);

  useEffect(() => {
    if (cardMode !== 'timer' || startedAt === null) return;
    const tick = () => {
      const rem = Math.max(0, 120 - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setCardMode('started');
        onAnnounce('You started. That counts.');
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cardMode, startedAt, onAnnounce]);

  const exit =
    leaving === 'notToday'
      ? gentle
        ? { opacity: 0, transition: { duration: 0.25 } }
        : { opacity: 0, x: 110, rotate: 1.2, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const } }
      : gentle
        ? { opacity: 0, transition: { duration: 0.25 } }
        : { opacity: 0, scale: 0.96, filter: 'blur(6px)', transition: { duration: 0.5, ease: 'easeOut' } };

  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, '0');
  const timeFormatted = `${mins}:${secs}`;

  const handleDone = () => {
    setLeaving('done');
    setBloom(true);
    window.setTimeout(() => onDone(task.id), 300);
  };

  const handleNotToday = () => {
    setLeaving('notToday');
    window.setTimeout(() => onNotToday(task.id), 60);
  };

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
      <AnimatePresence mode="wait" initial={false}>
        {cardMode === 'timer' ? (
          <motion.div
            key="timer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--ink-soft)' }}>
              Just open the thing.
            </p>
            <h2 className="font-display mt-3 text-2xl leading-snug sm:text-3xl">{task.title}</h2>
            <p role="timer" className="font-display mt-5 text-5xl tabular-nums sm:text-6xl">
              {timeFormatted}
            </p>
            <svg
              viewBox="0 0 200 6"
              className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full"
              aria-hidden="true"
            >
              <rect width="200" height="6" rx="3" fill="var(--glass-strong)" />
              <rect width={200 * ((120 - remaining) / 120)} height="6" rx="3" fill="var(--focus)" />
            </svg>
            <p className="mt-4 text-sm" style={{ color: 'var(--ink-soft)' }}>
              Two minutes. Nothing more is needed.
            </p>
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                className="btn btn-soft h-12 px-6 text-sm"
                onClick={() => {
                  setCardMode('normal');
                  setStartedAt(null);
                }}
              >
                Stop timer
              </button>
            </div>
          </motion.div>
        ) : cardMode === 'started' ? (
          <motion.div
            key="started"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="font-display text-3xl leading-snug sm:text-4xl">You started. That counts.</h2>
            <p className="mt-3 text-base" style={{ color: 'var(--ink-soft)' }}>
              {task.title}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn btn-primary h-12 flex-1 text-base" onClick={handleDone}>
                <Check className="h-5 w-5" aria-hidden="true" />
                Done
              </button>
              <button
                type="button"
                className="btn btn-soft h-12 flex-1 text-base"
                onClick={() => {
                  setCardMode('normal');
                  setStartedAt(null);
                }}
              >
                Keep going
              </button>
              <button type="button" className="btn btn-soft h-12 flex-1 text-base" onClick={handleNotToday}>
                <Sunrise className="h-5 w-5" aria-hidden="true" />
                Not today
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EffortPill effort={task.effort} />
            <h2 className="font-display mt-4 text-3xl leading-snug sm:text-[44px]">{task.title}</h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
              One thing is plenty today.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn btn-primary h-16 flex-1 text-lg" onClick={handleDone}>
                <Check className="h-5 w-5" aria-hidden="true" />
                Done
              </button>
              <button type="button" className="btn btn-soft h-16 flex-1 text-lg" onClick={handleNotToday}>
                <Sunrise className="h-5 w-5" aria-hidden="true" />
                Not today
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn btn-soft h-12 flex-1 text-sm"
                onClick={() => {
                  setStartedAt(Date.now());
                  setRemaining(120);
                  setCardMode('timer');
                  onAnnounce('Two minute timer started. Just open the thing.');
                }}
              >
                <Timer className="h-4 w-4" aria-hidden="true" />
                Help me start
              </button>
              <button
                type="button"
                className="btn btn-soft h-12 flex-1 text-sm"
                onClick={() => {
                  setLeaving('notToday');
                  window.setTimeout(() => onHarder(task.id), 60);
                }}
              >
                <Mountain className="h-4 w-4" aria-hidden="true" />
                Harder than it looked
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

export function LowView({
  task,
  upcoming,
  note,
  onDone,
  onNotToday,
  onHarder,
  onAdd,
  onAnnounce,
}: {
  task: Task | null;
  upcoming: Task[];
  note: string | null;
  onDone: (id: string) => void;
  onNotToday: (id: string) => void;
  onHarder: (id: string) => void;
  onAdd: (title: string, effort: Effort) => void;
  onAnnounce: (msg: string) => void;
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
              <FocusCard
                key={task.id}
                task={task}
                onDone={onDone}
                onNotToday={onNotToday}
                onHarder={onHarder}
                onAnnounce={onAnnounce}
              />
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
          <ComingUp tasks={upcoming} />
          <div className="mt-6">
            <QuickAdd compact placeholder="Jot something for later…" onAdd={onAdd} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
