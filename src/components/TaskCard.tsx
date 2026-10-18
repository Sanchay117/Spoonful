import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Effort, Task } from '../state/tasks';
import { effortLabel } from '../state/tasks';
import { useGentle } from './gentle';
import { EffortPill } from './bits';

const spring = { type: 'spring', stiffness: 260, damping: 28 } as const;

function Bloom() {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{ background: 'radial-gradient(circle at 12% 50%, var(--glow) 0%, transparent 62%)' }}
      initial={{ opacity: 0.95, scale: 0.25 }}
      animate={{ opacity: 0, scale: 1.15 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    />
  );
}

function TaskForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial?: Task;
  submitLabel: string;
  onSubmit: (title: string, effort: Effort) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [effort, setEffort] = useState<Effort>(initial?.effort ?? 'light');
  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onSubmit(t, effort);
  };
  return (
    <div className="flex flex-col gap-3 p-4">
      <label htmlFor={initial ? `edit-${initial.id}` : 'new-task-title'} className="sr-only">
        Task title
      </label>
      <input
        id={initial ? `edit-${initial.id}` : 'new-task-title'}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Something gentle…"
        autoFocus
        className="w-full bg-transparent text-base outline-none"
        style={{ color: 'var(--ink)' }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <fieldset className="flex items-center gap-1.5">
          <legend className="sr-only">How much effort is it?</legend>
          {(['light', 'medium', 'heavy'] as Effort[]).map((e) => (
            <label key={e} className="cursor-pointer">
              <input
                type="radio"
                name={initial ? `effort-${initial.id}` : 'effort-new'}
                className="sr-only"
                checked={effort === e}
                onChange={() => setEffort(e)}
              />
              <span
                className={`pill transition-opacity duration-200 ${effort === e ? `pill-${e}` : 'hover:brightness-95'}`}
                style={effort === e ? undefined : { color: 'var(--ink-soft)' }}
              >
                {effortLabel[e]}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex items-center gap-2">
          <button type="button" className="icon-btn" aria-label="Cancel" onClick={onCancel}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-primary" disabled={!title.trim()} onClick={submit}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Composer({ onAdd, onClose }: {
  onAdd: (title: string, effort: Effort) => void;
  onClose: () => void;
}) {
  return (
    <motion.div layout className="glass rounded-2xl" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
      <TaskForm submitLabel="Add" onSubmit={onAdd} onCancel={onClose} />
    </motion.div>
  );
}

export function TaskCard({ task, index, onDone, onEdit, onRemove }: {
  task: Task;
  index: number;
  onDone: (id: string) => void;
  onEdit: (id: string, patch: Partial<Task>) => void;
  onRemove: (id: string) => void;
}) {
  const gentle = useGentle();
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [bloom, setBloom] = useState(false);

  const exit = gentle
    ? { opacity: 0, transition: { duration: 0.25 } }
    : {
        opacity: 0,
        y: 26,
        scale: 0.97,
        filter: 'blur(4px)',
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const, delay: Math.min(index * 0.05, 0.3) },
      };

  if (editing) {
    return (
      <motion.li
        layout
        layoutId={`task-${task.id}`}
        data-task-card
        exit={exit}
        transition={spring}
        className="glass list-none rounded-2xl"
      >
        <TaskForm
          initial={task}
          submitLabel="Save"
          onSubmit={(title, effort) => {
            onEdit(task.id, { title, effort });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </motion.li>
    );
  }

  return (
    <motion.li
      layout
      layoutId={`task-${task.id}`}
      data-task-card
      exit={exit}
      initial={{ opacity: 0, y: gentle ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={gentle ? { duration: 0.25 } : spring}
      className="glass group relative list-none overflow-hidden rounded-2xl"
    >
      {bloom && <Bloom />}
      <div className="flex items-center gap-1 p-2 pl-2 sm:gap-2">
        <button
          type="button"
          className="icon-btn shrink-0"
          aria-label={`Mark “${task.title}” as done`}
          onClick={() => {
            setBloom(true);
            window.setTimeout(() => onDone(task.id), 240);
          }}
          style={{ background: 'var(--pill-light-bg)', color: 'var(--pill-light-ink)' }}
        >
          <Check className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate px-1 text-[15px] sm:text-base">{task.title}</p>
        <EffortPill effort={task.effort} />
        <div className="flex shrink-0 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button type="button" className="icon-btn" aria-label={`Edit “${task.title}”`} onClick={() => setEditing(true)}>
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={confirmRemove ? `Confirm removing “${task.title}”` : `Remove “${task.title}”`}
            onClick={() => {
              if (confirmRemove) {
                onRemove(task.id);
              } else {
                setConfirmRemove(true);
                window.setTimeout(() => setConfirmRemove(false), 2600);
              }
            }}
          >
            {confirmRemove ? (
              <span className="text-xs font-semibold">Remove?</span>
            ) : (
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </motion.li>
  );
}
