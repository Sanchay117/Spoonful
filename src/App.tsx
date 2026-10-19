import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Effort, Energy, Task } from './state/tasks';
import {
  dueSoon,
  effortLabel,
  goodSplit,
  heavierEffort,
  nextEffort,
  okaySplit,
  pickForLow,
  sortedToday,
  todayStr,
  tomorrowStr,
  uid,
} from './state/tasks';
import { loadEnergy, loadSettings, loadTasks, saveEnergy, saveSettings, saveTasks } from './state/storage';
import { makeDemoTasks } from './state/demo';
import { Aura } from './components/Aura';
import { Header } from './components/Header';
import { CheckIn } from './components/CheckIn';
import { ListView } from './components/ListView';
import { LowView } from './components/LowView';
import { CompareView } from './components/CompareView';
import { ReminderDialog } from './components/ReminderDialog';
import { GentleContext } from './components/gentle';

const VIEW_MSG: Record<Energy, string> = {
  good: 'Good energy. Showing up to five tasks, gentlest first.',
  okay: 'Okay energy. Showing three tasks. The rest are resting.',
  low: 'Low energy. One thing at a time.',
};

const tap = () => {
  try {
    navigator.vibrate?.(10);
  } catch {
    // haptics unavailable
  }
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [lastEnergy] = useState<Energy | null>(() => loadEnergy());
  const [energy, setEnergy] = useState<Energy>(() => loadEnergy() ?? 'good');
  const [calm, setCalm] = useState(() => loadSettings().calm);
  const [checkinOpen, setCheckinOpen] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [liveMsg, setLiveMsg] = useState('');
  const prefersReduced = useReducedMotion();
  const gentle = !!prefersReduced || calm;
  const mainRef = useRef<HTMLElement>(null);
  const noteTimer = useRef<number | undefined>(undefined);

  const paletteEnergy: Energy = checkinOpen ? (lastEnergy ?? 'okay') : energy;

  const announce = useCallback((msg: string) => {
    setLiveMsg(' ');
    window.setTimeout(() => setLiveMsg(msg), 60);
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveSettings({ calm });
  }, [calm]);

  useEffect(() => {
    document.documentElement.dataset.energy = paletteEnergy;
    document.documentElement.dataset.ambient = gentle ? 'off' : 'on';
  }, [paletteEnergy, gentle]);

  useEffect(() => {
    const shell = document.querySelectorAll<HTMLElement>('[data-shell]');
    const hide = checkinOpen || compareOpen;
    shell.forEach((el) => (hide ? el.setAttribute('inert', '') : el.removeAttribute('inert')));
    if (!hide && mainRef.current) mainRef.current.focus({ preventScroll: true });
  }, [checkinOpen, compareOpen]);

  useEffect(() => {
    return () => window.clearTimeout(noteTimer.current);
  }, []);

  const showNote = useCallback((msg: string) => {
    window.clearTimeout(noteTimer.current);
    setNote(msg);
    noteTimer.current = window.setTimeout(() => setNote(null), 3600);
  }, []);

  const choose = useCallback(
    (e: Energy) => {
      setEnergy(e);
      saveEnergy(e);
      setCheckinOpen(false);
      setNote(null);
      announce(VIEW_MSG[e]);
    },
    [announce]
  );

  const addTask = useCallback(
    (title: string, effort: Effort = 'medium') => {
      const task: Task = { id: uid(), title, effort, createdAt: Date.now(), scheduledFor: todayStr() };
      const nextTasks = [...tasks, task];
      setTasks(nextTasks);
      announce(`Added “${title}” as Medium.`);
      if (energy === 'okay' && !okaySplit(nextTasks).shown.some((t) => t.id === task.id)) {
        showNote('Added. It’s resting for now, hidden, not deleted.');
      } else if (energy === 'low') {
        showNote('Added for a better day.');
      }
    },
    [tasks, energy, announce, showNote]
  );

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        const next: Task = { ...t, ...patch };
        if (!next.dueDate) {
          delete next.dueDate;
        }
        return next;
      })
    );
  }, []);

  const retag = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const next = nextEffort(task.effort);
      const nextTasks = tasks.map((t) => (t.id === id ? { ...t, effort: next } : t));
      setTasks(nextTasks);
      announce(`“${task.title}” is now ${effortLabel[next]}.`);
      if (
        energy === 'okay' &&
        okaySplit(tasks).shown.some((t) => t.id === id) &&
        !okaySplit(nextTasks).shown.some((t) => t.id === id)
      ) {
        showNote(`“${task.title}” is ${effortLabel[next]} now, so it’s resting today.`);
      }
    },
    [tasks, energy, announce, showNote]
  );

  const onHarder = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const next = heavierEffort(task.effort);
      const label = effortLabel[next];
      const nextTasks = tasks.map((t) => (t.id === id ? { ...t, effort: next } : t));
      setTasks(nextTasks);
      const msg =
        pickForLow(nextTasks) !== null
          ? `Moved to ${label}. Here’s something lighter.`
          : `Moved to ${label}. Nothing else is light, so rest counts today.`;
      showNote(msg);
      announce(msg);
    },
    [tasks, announce, showNote]
  );

  const removeTask = useCallback(
    (id: string) => {
      setTasks((ts) => ts.filter((t) => t.id !== id));
      announce('Task removed.');
    },
    [announce]
  );

  const completeTask = useCallback((id: string) => {
    tap();
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, completedAt: Date.now() } : t)));
  }, []);

  const notToday = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, scheduledFor: tomorrowStr() } : t)));
      showNote('Saved for tomorrow. That’s okay.');
      announce(task ? `“${task.title}” moved to tomorrow.` : 'Saved for tomorrow.');
    },
    [tasks, announce, showNote]
  );

  const loadDemo = useCallback(() => {
    setTasks(makeDemoTasks());
    setNote(null);
    announce('Loaded a demo day with 20 tasks.');
  }, [announce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === 'Escape') {
        if (compareOpen) {
          setCompareOpen(false);
          announce('Closed the comparison.');
        } else if (checkinOpen) {
          choose(energy);
        }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'c' || e.key === 'C') setCompareOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compareOpen, checkinOpen, choose, energy, announce]);

  const good = useMemo(() => sortedToday(tasks), [tasks]);
  const { shown: goodShown, more: goodMore } = useMemo(() => goodSplit(tasks), [tasks]);
  const { shown, resting } = useMemo(() => okaySplit(tasks), [tasks]);
  const lowTask = useMemo(() => pickForLow(tasks), [tasks]);
  const upcoming = useMemo(() => {
    if (energy === 'okay') return dueSoon(tasks, shown);
    if (energy === 'good') return dueSoon(tasks, goodShown);
    return dueSoon(tasks, lowTask ? [lowTask] : []);
  }, [energy, tasks, shown, goodShown, lowTask]);

  return (
    <div className="relative h-dvh overflow-hidden">
      <Aura energy={paletteEnergy} ambient={!gentle} />

      <div aria-live="polite" role="status" className="sr-only">
        {liveMsg}
      </div>

      <GentleContext.Provider value={gentle}>
        <div className="relative z-10 flex h-full flex-col">
          <div data-shell>
            <Header
              energy={energy}
              onEnergy={choose}
              calm={calm}
              onCalm={() => {
                setCalm((v) => !v);
                announce(calm ? 'Calm mode off.' : 'Calm mode on. Ambient motion is resting.');
              }}
              onDemo={loadDemo}
              onCompare={() => setCompareOpen(true)}
              onReminder={() => setReminderOpen(true)}
            />
          </div>

          <main ref={mainRef} tabIndex={-1} className="relative min-h-0 flex-1">
            <div data-shell className="absolute inset-0">
              <AnimatePresence initial={false}>
                {energy === 'low' ? (
                  <LowView
                    key="low"
                    task={lowTask}
                    upcoming={upcoming}
                    note={note}
                    onDone={completeTask}
                    onNotToday={notToday}
                    onHarder={onHarder}
                    onAdd={addTask}
                    onAnnounce={announce}
                  />
                ) : energy === 'okay' ? (
                  <ListView
                    key="okay"
                    mode="okay"
                    tasks={shown}
                    more={[]}
                    resting={resting}
                    upcoming={upcoming}
                    note={note}
                    onAdd={addTask}
                    onEdit={updateTask}
                    onRemove={removeTask}
                    onDone={completeTask}
                    onRetag={retag}
                  />
                ) : (
                  <ListView
                    key="good"
                    mode="good"
                    tasks={goodShown}
                    more={goodMore}
                    resting={[]}
                    upcoming={upcoming}
                    note={note}
                    onAdd={addTask}
                    onEdit={updateTask}
                    onRemove={removeTask}
                    onDone={completeTask}
                    onRetag={retag}
                  />
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {checkinOpen && <CheckIn key="checkin" last={lastEnergy} onChoose={choose} />}
            </AnimatePresence>

            <AnimatePresence>
              {compareOpen && (
                <CompareView
                  key="compare"
                  tasks={good}
                  lowTitle={lowTask?.title ?? null}
                  onClose={() => {
                    setCompareOpen(false);
                    announce('Closed the comparison.');
                  }}
                />
              )}
            </AnimatePresence>

            <ReminderDialog
              open={reminderOpen}
              onClose={() => setReminderOpen(false)}
              onAnnounce={announce}
            />
          </main>

          <div data-shell>
            <footer className="px-6 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-1 text-center text-xs" style={{ color: 'var(--ink-soft)' }}>
              Everything stays on this device. No streaks, no red badges, no shame.
            </footer>
          </div>
        </div>
      </GentleContext.Provider>
    </div>
  );
}
