import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Effort } from '../state/tasks';

export function QuickAdd({
  onAdd,
  compact = false,
  placeholder = 'Add a task and press Enter',
}: {
  onAdd: (title: string, effort: Effort) => void;
  compact?: boolean;
  placeholder?: string;
}) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) {
          inputRef.current?.focus();
          return;
        }
        onAdd(trimmed, 'medium');
        setTitle('');
        inputRef.current?.focus();
      }}
      className={`glass flex items-center gap-2 rounded-2xl ${compact ? 'p-1.5 pl-4' : 'p-2 pl-4'}`}
    >
      <label htmlFor="quick-add" className="sr-only">
        Add a task
      </label>
      <input
        ref={inputRef}
        id="quick-add"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className={`h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-[color:var(--ink-soft)] ${
          compact ? 'text-sm' : 'text-base'
        }`}
        style={{ color: 'var(--ink)' }}
      />
      <button
        type="submit"
        className={`btn ${compact ? 'btn-soft h-12 px-4 text-sm' : 'btn-primary h-12 px-4 text-sm'}`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add
      </button>
    </form>
  );
}
