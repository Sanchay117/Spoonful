import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Effort, Task } from '../state/tasks';
import { dueLabel, effortLabel } from '../state/tasks';
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
  onSubmit: (title: string, effort: Effort, dueDate?: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [effort, setEffort] = useState<Effort>(initial?.effort ?? 'light');
  const [due, setDue] = useState(initial?.dueDate ?? '');
  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onSubmit(t, effort, due || undefined);
  };
  const dueId = initial ? `due-${initial.id}` : 'due-new';
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
        className="min-h-12 w-full bg-transparent text-base outline-none"
        style={{ color: 'var(--ink)' }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={dueId} className="text-xs font-medium" style={{ color: 'var(--ink-soft)' }}>
          Due date (optional)
        </label>
        <input
          id={dueId}
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="glass min-h-12 rounded-xl px-3 text-sm outline-none"
          style={{ color: 'var(--ink)' }}
        />
        {due && (
          <button
            type="button"
            className="inline-flex min-h-12 items-center px-2 text-xs font-medium underline-offset-4 hover:underline"
            style={{ color: 'var(--ink-soft)' }}
            onClick={() => setDue('')}
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <fieldset className="flex items-center gap-1.5">
          <legend className="sr-only">How much effort is it?</legend>
          {(['light', 'medium', 'heavy'] as Effort[]).map((e) => (
            <label key={e} className="inline-flex min-h-12 cursor-pointer items-center">
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

export function TaskCard({ task, index, onDone, onEdit, onRemove, onRetag }: {
  task: Task;
  index: number;
  onDone: (id: string) => void;
  onEdit: (id: string, patch: Partial<Task>) => void;
  onRemove: (id: string) => void;
  onRetag: (id: string) => void;
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
          onSubmit={(title, effort, due) => {
            onEdit(task.id, { title, effort, dueDate: due || undefined });
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
        {task.dueDate && (
          <span
            className="hidden shrink-0 items-center gap-1 text-xs sm:inline-flex"
            style={{ color: 'var(--ink-soft)' }}
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {dueLabel(task.dueDate)}
          </span>
        )}
        <button
          type="button"
          className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-transparent px-1"
          onClick={() => onRetag(task.id)}
        >
          <EffortPill effort={task.effort} />
          <span className="sr-only"> effort for “{task.title}”, tap to change</span>
        </button>
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
