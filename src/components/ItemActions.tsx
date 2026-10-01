"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const TYPE_LABEL: Record<string, string> = {
  PROJECT: 'track',
  WORKSTREAM: 'workstream',
  TASK: 'task',
  SUBTASK: 'sub-task',
};

const STATUS_OPTIONS = [
  { value: 'TO_DO', label: 'To do' },
  { value: 'DOING', label: 'Doing' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'LIVE', label: 'Live' },
];

type Person = { id: string; name: string; role: string };

type ItemLike = {
  id: string;
  title: string;
  type: string;
  status: string;
  targetStartDate?: string | Date | null;
  targetEndDate?: string | Date | null;
  team?: { id: string }[];
  children?: ItemLike[];
};

const toDateInput = (d?: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function countBelow(item: ItemLike): { workstreams: number; tasks: number; other: number } {
  const out = { workstreams: 0, tasks: 0, other: 0 };
  const walk = (node: ItemLike) => {
    for (const c of node.children ?? []) {
      if (c.type === 'WORKSTREAM') out.workstreams++;
      else if (c.type === 'TASK') out.tasks++;
      else out.other++;
      walk(c);
    }
  };
  walk(item);
  return out;
}

function describeBelow(item: ItemLike): string {
  const { workstreams, tasks, other } = countBelow(item);
  const parts: string[] = [];
  if (workstreams) parts.push(`${workstreams} workstream${workstreams === 1 ? '' : 's'}`);
  if (tasks) parts.push(`${tasks} task${tasks === 1 ? '' : 's'}`);
  if (other) parts.push(`${other} sub-task${other === 1 ? '' : 's'}`);
  return parts.join(' and ');
}

/**
 * Edit and Delete buttons for a track, workstream or task, with their dialogs.
 * Only render this for the Super Admin: the API refuses everyone else regardless.
 */
export default function ItemActions({
  item,
  people,
  redirectAfterDelete,
  compact = false,
}: {
  item: ItemLike;
  people?: Person[];
  redirectAfterDelete?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const label = TYPE_LABEL[item.type] ?? 'item';
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', status: 'TO_DO', start: '', end: '', teamIds: [] as string[] });

  const open = (m: 'edit' | 'delete') => {
    setForm({
      title: item.title,
      status: item.status,
      start: toDateInput(item.targetStartDate),
      end: toDateInput(item.targetEndDate),
      teamIds: (item.team ?? []).map((t) => t.id),
    });
    setError('');
    setMode(m);
  };
  const close = () => { if (!busy) setMode(null); };

  // The three-dots menu is positioned from the button's place on screen (fixed), because the panels it sits in clip overflow.
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = 148;
    const h = 92;
    const fitsBelow = window.innerHeight - r.bottom > h + 8;
    setMenu({
      x: Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)),
      y: fitsBelow ? r.bottom + 4 : Math.max(8, r.top - h - 4),
    });
  };

  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) setMenu(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenu(null); btnRef.current?.focus(); }
    };
    const dismiss = () => setMenu(null);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [menu]);

  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) setMode(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, busy]);

  async function send(method: 'PATCH' | 'DELETE', body?: unknown) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Nothing was changed.');
        return false;
      }
      return true;
    } catch {
      setError('Could not reach the server. Nothing was changed.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const ok = await send('PATCH', {
      title: form.title,
      status: form.status,
      targetStartDate: form.start || null,
      targetEndDate: form.end || null,
      teamIds: form.teamIds,
    });
    if (ok) {
      setMode(null);
      router.refresh();
    }
  }

  async function remove() {
    const ok = await send('DELETE');
    if (ok) {
      setMode(null);
      if (redirectAfterDelete) router.push(redirectAfterDelete);
      router.refresh();
    }
  }

  const below = describeBelow(item);
  const field = 'w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] bg-white';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (menu ? setMenu(null) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        aria-label={`Actions for ${label} ${item.title}`}
        className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} shrink-0 inline-flex items-center justify-center rounded-full text-[#5A5E63] hover:bg-[#E2DCCF] hover:text-[#121519] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#121519] transition-colors ${menu ? 'bg-[#E2DCCF] text-[#121519]' : ''}`}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`${label} actions`}
          className="fixed z-[70] w-[148px] py-1.5 bg-white border border-[#DDD9CE] rounded-xl shadow-lg text-left"
          style={{ left: menu.x, top: menu.y }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setMenu(null); open('edit'); }}
            className="w-full px-4 py-2 text-left text-[14px] font-semibold text-[#121519] hover:bg-[#F2EEE5] focus:outline-none focus:bg-[#F2EEE5]"
          >
            Edit {label}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setMenu(null); open('delete'); }}
            className="w-full px-4 py-2 text-left text-[14px] font-semibold text-[#9E2F24] hover:bg-[#F7E1DD] focus:outline-none focus:bg-[#F7E1DD]"
          >
            Delete {label}
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div role="dialog" aria-modal="true" aria-label={`Edit ${label}`} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto text-left text-[#121519]">
            <h2 className="font-extrabold text-[30px] uppercase border-b border-[#DDD9CE] pb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Edit {label}
            </h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`t-${item.id}`} className="text-[13px] font-bold text-[#5A5E63]">Title</label>
              <input id={`t-${item.id}`} type="text" value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${field} font-bold`} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`s-${item.id}`} className="text-[13px] font-bold text-[#5A5E63]">Status</label>
              <select id={`s-${item.id}`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${field} font-semibold`}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor={`sd-${item.id}`} className="text-[13px] font-bold text-[#5A5E63]">Start date</label>
                <input id={`sd-${item.id}`} type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={field} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor={`ed-${item.id}`} className="text-[13px] font-bold text-[#5A5E63]">End date</label>
                <input id={`ed-${item.id}`} type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={field} />
              </div>
            </div>

            {people && people.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`m-${item.id}`} className="text-[13px] font-bold text-[#5A5E63]">Team members</label>
                <select
                  id={`m-${item.id}`}
                  multiple
                  value={form.teamIds}
                  onChange={(e) => setForm({ ...form, teamIds: Array.from(e.target.selectedOptions, (o) => o.value) })}
                  className="w-full h-24 p-2 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] bg-white font-semibold"
                >
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                </select>
                <span className="text-[11px] text-[#8A8E93]">Hold Cmd/Ctrl to select several.</span>
              </div>
            )}

            {error && <div role="alert" className="text-[14px] font-semibold text-[#9E2F24]">{error}</div>}

            <div className="flex gap-4 pt-4 border-t border-[#DDD9CE]">
              <button type="button" onClick={close} disabled={busy} className="flex-grow h-12 rounded-full font-bold text-[15px] border-2 border-[#121519] hover:bg-[#F2EEE5] transition-colors disabled:opacity-50">Cancel</button>
              <button type="button" onClick={save} disabled={busy || !form.title.trim()} className="flex-grow h-12 rounded-full font-bold text-[15px] bg-[#121519] text-white hover:bg-black transition-colors disabled:opacity-50">
                {busy ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'delete' && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div role="alertdialog" aria-modal="true" aria-label={`Delete ${label}`} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 flex flex-col gap-5 text-left text-[#121519]">
            <h2 className="font-extrabold text-[30px] uppercase border-b border-[#DDD9CE] pb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Delete {label}
            </h2>
            <p className="text-[15px] leading-[1.5]">
              Delete the {label} <strong>{item.title}</strong>?
              {item.type !== 'TASK' || below
                ? <> This also permanently deletes {below ? `its ${below}` : 'everything under it'}, with their hurdles, notes, documents and stage gates.</>
                : <> This also permanently deletes its hurdles, notes, documents and anything under it.</>}
              {' '}This cannot be undone.
            </p>
            {error && <div role="alert" className="text-[14px] font-semibold text-[#9E2F24]">{error}</div>}
            <div className="flex gap-4 pt-4 border-t border-[#DDD9CE]">
              <button type="button" onClick={close} disabled={busy} autoFocus className="flex-grow h-12 rounded-full font-bold text-[15px] border-2 border-[#121519] hover:bg-[#F2EEE5] transition-colors disabled:opacity-50">Cancel</button>
              <button type="button" onClick={remove} disabled={busy} className="flex-grow h-12 rounded-full font-bold text-[15px] bg-[#9E2F24] text-white hover:bg-[#7F251C] transition-colors disabled:opacity-50">
                {busy ? 'Deleting...' : `Delete ${label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
