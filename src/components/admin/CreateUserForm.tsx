"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  LEADERSHIP: 'Leadership',
  LEAD: 'Lead',
  TEAMMATE: 'Teammate',
  OWNER: 'SAI owner',
};

export default function CreateUserForm({ roles }: { roles: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', loginId: '', password: '', role: roles[0] ?? '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: `Account created for ${data.person?.name}.` });
        setForm({ name: '', loginId: '', password: '', role: roles[0] ?? '' });
        router.refresh();
      } else {
        setMessage({ ok: false, text: data.error || 'Something went wrong.' });
      }
    } catch {
      setMessage({ ok: false, text: 'Could not reach the server.' });
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full h-11 px-4 rounded-xl border border-[#DDD9CE] bg-white focus:outline-none focus:border-[#121519]';
  const label = 'text-[13px] font-bold text-[#5A5E63]';

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-[#DDD9CE] shadow-sm p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-name" className={label}>Full name</label>
        <input id="cu-name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-login" className={label}>Login ID</label>
        <input id="cu-login" className={field} value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} autoComplete="off" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-pass" className={label}>Temporary password</label>
        <input id="cu-pass" type="password" className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
        <span className="text-[12px] text-[#5A5E63]">At least 10 characters, with letters and digits.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cu-role" className={label}>Role</label>
        <select id="cu-role" className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {roles.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
          ))}
        </select>
      </div>
      {message && (
        <div role="status" className={`text-[14px] font-semibold ${message.ok ? 'text-[#1F6B4A]' : 'text-[#9E2F24]'}`}>{message.text}</div>
      )}
      <button type="submit" disabled={busy} className="min-h-[46px] rounded-full bg-[#121519] text-white font-bold text-[15px] disabled:opacity-50">
        {busy ? 'Creating...' : 'Create account'}
      </button>
    </form>
  );
}
