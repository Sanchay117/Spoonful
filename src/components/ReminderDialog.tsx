import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { buildReminderIcs } from '../state/reminder';

export function ReminderDialog({
  open,
  onClose,
  onAnnounce,
}: {
  open: boolean;
  onClose: () => void;
  onAnnounce: (msg: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [time, setTime] = useState('09:00');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) {
        el.showModal();
      }
      setDownloaded(false);
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reminder-title"
      onClose={onClose}
      onCancel={onClose}
      className="w-full max-w-[26rem] rounded-3xl border p-6 shadow-2xl backdrop:bg-black/45"
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        borderColor: 'var(--glass-brd)',
      }}
    >
      <h2 id="reminder-title" className="font-display text-2xl sm:text-3xl">
        A gentle daily nudge
      </h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
        Spoonful keeps everything on this device, so it never sends notifications. Add a daily check-in to your own calendar instead.
      </p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <label htmlFor="reminder-time" className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
          Time
        </label>
        <input
          id="reminder-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="glass min-h-12 rounded-xl px-3 text-sm outline-none"
          style={{ color: 'var(--ink)' }}
        />
      </div>
      {downloaded && (
        <p role="status" className="mt-4 text-xs" style={{ color: 'var(--ink-soft)' }}>
          Open the file to add it to your calendar.
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="btn btn-soft h-12 px-5 text-sm"
          onClick={() => {
            dialogRef.current?.close();
            onClose();
          }}
        >
          Close
        </button>
        <button
          type="button"
          className="btn btn-primary h-12 px-5 text-sm"
          onClick={() => {
            const ics = buildReminderIcs(time || '09:00');
            const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'spoonful-check-in.ics';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            setDownloaded(true);
            onAnnounce('Open the file to add it to your calendar.');
          }}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download calendar file
        </button>
      </div>
    </dialog>
  );
}
