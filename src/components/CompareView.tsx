import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Task } from '../state/tasks';
import { makeDemoTasks } from '../state/demo';

const OVERDUE = new Set([0, 5, 9, 13, 16]);

function MockList({ tasks }: { tasks: Task[] }) {
  const overdue = tasks.filter((_, i) => OVERDUE.has(i)).length;
  return (
    <div
      className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-[#e2e2e7] bg-white text-[#1c1c1e]"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className="border-b border-[#e5e5ea] bg-[#fafafa] px-4 py-3">
        <p className="text-sm font-bold">
          Inbox <span className="font-normal text-[#6e6e73]">({tasks.length})</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-[#ffecea] px-2 py-1 text-[#b3261e]">{overdue} overdue</span>
          <span className="rounded-full bg-[#eef0f4] px-2 py-1 text-[#3c4043]">🔥 4-day streak</span>
          <span className="rounded-full bg-[#e8f0fe] px-2 py-1 text-[#1a56b8]">12% complete</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-[#e5e5ea]">
          <div className="h-full w-[12%] rounded-full bg-[#1a73e8]" />
        </div>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-[#ececF1] overflow-y-auto">
        {tasks.map((t, i) => {
          const isOverdue = OVERDUE.has(i);
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-2">
              <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-[4px] border-2 border-[#c7c7cc]" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#1c1c1e]">{t.title}</span>
              {isOverdue ? (
                <span className="shrink-0 rounded bg-[#ffecea] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#b3261e]">
                  overdue
                </span>
              ) : (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#6d6d72]">today</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="border-t border-[#e5e5ea] bg-[#fafafa] px-4 py-2 text-[11px] text-[#6e6e73]">
        {tasks.length} tasks · {overdue} overdue · don’t break the streak!
      </p>
    </div>
  );
}

function SpoonfulSide({ focusTitle }: { focusTitle: string }) {
  return (
    <div
      className="relative flex min-h-0 flex-col overflow-hidden rounded-3xl border"
      style={{ borderColor: 'rgba(255,255,255,0.14)', background: 'linear-gradient(160deg, #262248 0%, #3a2a52 100%)' }}
    >
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-[#f2effa]">
          Spoonful <span className="font-normal text-[#c6c0e0]">· low energy day</span>
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-[1.75rem] border border-white/15 bg-white/[0.08] px-7 py-9 text-center"
          style={{ backdropFilter: 'blur(20px)', boxShadow: '0 20px 70px rgba(255,175,143,0.16)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c6c0e0]">Today’s one thing</p>
          <h3 className="font-display mt-3 text-2xl leading-snug text-[#f6efe2]">{focusTitle}</h3>
          <div className="mt-7 flex gap-3">
            <div
              aria-hidden="true"
              className="flex h-14 flex-1 items-center justify-center rounded-full bg-gradient-to-br from-[#ffdca6] to-[#ffab8c] text-base font-medium text-[#3a2440]"
            >
              Done
            </div>
            <div
              aria-hidden="true"
              className="flex h-14 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/10 text-base font-medium text-[#f2effa]"
            >
              Not today
            </div>
          </div>
        </div>
      </div>
      <p className="px-4 pb-4 text-center text-xs text-[#c6c0e0]">One task. Two gentle choices.</p>
    </div>
  );
}

export function CompareView({ tasks, lowTitle, onClose }: {
  tasks: Task[];
  lowTitle: string | null;
  onClose: () => void;
}) {
  const list = tasks.length > 0 ? tasks : makeDemoTasks();
  const focusTitle =
    lowTitle ?? list.find((t) => t.effort === 'light')?.title ?? 'Take morning meds with breakfast';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Compare: a typical to-do list versus Spoonful"
      className="fixed inset-0 z-50 flex flex-col bg-black/20 p-4 sm:p-8"
      style={{ backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-2xl sm:text-3xl">The same day, two ways.</p>
        <button type="button" className="icon-btn" aria-label="Close comparison" onClick={onClose}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex min-h-0 flex-col">
          <p className="mb-2 px-1 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
            A typical to-do app: everything, everywhere, all at once.
          </p>
          <div className="min-h-0 flex-1">
            <MockList tasks={list} />
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <p className="mb-2 px-1 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
            The same day in Spoonful, low energy: only what fits.
          </p>
          <div className="min-h-0 flex-1">
            <SpoonfulSide focusTitle={focusTitle} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs" style={{ color: 'var(--ink-soft)' }}>
        Press C or Escape to close.
      </p>
    </motion.div>
  );
}
