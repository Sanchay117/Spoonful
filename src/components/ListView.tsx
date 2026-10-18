import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Effort, Task } from '../state/tasks';
import { useGentle } from './gentle';
import { EffortPill, EmptyState } from './bits';
import { Composer, TaskCard } from './TaskCard';

function RestNote({ resting }: { resting: Task[] }) {
  const [open, setOpen] = useState(false);
  const gentle = useGentle();
  if (resting.length === 0) return null;
  return (
    <div data-resting-note className="mt-2 text-center">
      <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        {resting.length === 1 ? '1 task resting quietly' : `${resting.length} tasks resting quietly`}. Hidden, not deleted.
      </p>
      <button
        type="button"
        className="mt-1 inline-flex min-h-12 items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        style={{ color: 'var(--ink)' }}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide them again' : 'Show them'}
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open &&
        (gentle ? (
          <ul className="mt-4 flex flex-col gap-2 text-left">
            {resting.map((t) => (
              <li key={t.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                <p className="min-w-0 flex-1 truncate text-[15px]" style={{ color: 'var(--ink-soft)' }}>
                  {t.title}
                </p>
                <EffortPill effort={t.effort} />
              </li>
            ))}
          </ul>
        ) : (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 flex flex-col gap-2 overflow-hidden text-left"
          >
            {resting.map((t) => (
              <li key={t.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                <p className="min-w-0 flex-1 truncate text-[15px]" style={{ color: 'var(--ink-soft)' }}>
                  {t.title}
                </p>
                <EffortPill effort={t.effort} />
              </li>
            ))}
          </motion.ul>
        ))}
    </div>
  );
}

export function ListView({ mode, tasks, resting, onAdd, onEdit, onRemove, onDone }: {
  mode: 'good' | 'okay';
  tasks: Task[];
  resting: Task[];
  onAdd: (title: string, effort: Effort) => void;
  onEdit: (id: string, patch: Partial<Task>) => void;
  onRemove: (id: string) => void;
  onDone: (id: string) => void;
}) {
  const gentle = useGentle();
  const [composerOpen, setComposerOpen] = useState(false);
  const heading = mode === 'good' ? 'Here’s everything, gentlest first.' : 'Three things is plenty today.';

  return (
    <motion.section
      data-view={mode}
      className="absolute inset-0 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: gentle ? 0.25 : 0.4 } }}
      exit={{ opacity: 0, transition: { duration: gentle ? 0.25 : 0.7, ease: 'easeInOut' } }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-5 pb-24 pt-3 sm:px-8">
        <h2 className="font-display text-2xl sm:text-[32px]">{heading}</h2>
        {composerOpen ? (
          <Composer
            onAdd={(t, e) => {
              onAdd(t, e);
              setComposerOpen(false);
            }}
            onClose={() => setComposerOpen(false)}
          />
        ) : (
          <button
            type="button"
            className="btn btn-soft w-full gap-2 rounded-2xl border-dashed text-base"
            onClick={() => setComposerOpen(true)}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Add a task
          </button>
        )}
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <ul data-testid="task-list" className="flex flex-col gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {tasks.map((t, i) => (
                <TaskCard key={t.id} task={t} index={i} onDone={onDone} onEdit={onEdit} onRemove={onRemove} />
              ))}
            </AnimatePresence>
          </ul>
        )}
        {mode === 'okay' && <RestNote resting={resting} />}
      </div>
    </motion.section>
  );
}
