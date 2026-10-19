import { CalendarDays } from 'lucide-react';
import type { Task } from '../state/tasks';
import { dueLabel } from '../state/tasks';

export function ComingUp({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <section
      aria-labelledby="coming-up-title"
      data-coming-up
      className="glass mt-4 rounded-2xl px-5 py-4"
    >
      <h3
        id="coming-up-title"
        className="text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: 'var(--ink-soft)' }}
      >
        Coming up
      </h3>
      <p className="mt-1 text-xs" style={{ color: 'var(--ink-soft)' }}>
        Just so you know. Nothing to do about it right now.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--ink)' }}>
              {t.title}
            </span>
            {t.dueDate && (
              <span
                className="inline-flex shrink-0 items-center gap-1 text-xs"
                style={{ color: 'var(--ink-soft)' }}
              >
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {dueLabel(t.dueDate)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
