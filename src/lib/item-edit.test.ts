import { describe, it, expect } from 'vitest';
import { parseItemPatch } from './item-edit';
import { canManageItems, ROLES } from './permissions';

const none = { targetStartDate: null, targetEndDate: null };

describe('who can edit or delete items', () => {
  it('is the super admin only', () => {
    expect(canManageItems('SUPER_ADMIN')).toBe(true);
    for (const r of ROLES.filter((x) => x !== 'SUPER_ADMIN')) expect(canManageItems(r)).toBe(false);
    for (const junk of [undefined, null, '', 'ROOT', 'super_admin']) expect(canManageItems(junk as string | null | undefined)).toBe(false);
  });
});

describe('parseItemPatch', () => {
  it('accepts a full valid edit and trims the title', () => {
    const r = parseItemPatch(
      { title: '  New name  ', status: 'DOING', targetStartDate: '2026-07-01', targetEndDate: '2026-09-30', teamIds: ['a', 'b', 'a'] },
      none,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.title).toBe('New name');
      expect(r.patch.status).toBe('DOING');
      expect(r.patch.teamIds).toEqual(['a', 'b']);
      expect(r.patch.targetStartDate?.toISOString().slice(0, 10)).toBe('2026-07-01');
    }
  });

  it('rejects bodies that are not an object, empty, or carry other fields', () => {
    for (const bad of [null, 'x', 5, [], {}]) expect(parseItemPatch(bad, none).ok).toBe(false);
    expect(parseItemPatch({ title: 'ok', parentId: 'x' }, none).ok).toBe(false);
    expect(parseItemPatch({ type: 'PROJECT' }, none).ok).toBe(false);
    expect(parseItemPatch({ weight: 9 }, none).ok).toBe(false);
  });

  it('validates title, status, dates and team', () => {
    expect(parseItemPatch({ title: '   ' }, none).ok).toBe(false);
    expect(parseItemPatch({ title: 'x'.repeat(201) }, none).ok).toBe(false);
    expect(parseItemPatch({ title: 42 }, none).ok).toBe(false);
    expect(parseItemPatch({ status: 'DONE' }, none).ok).toBe(false);
    expect(parseItemPatch({ targetEndDate: 'not a date' }, none).ok).toBe(false);
    expect(parseItemPatch({ targetEndDate: 20260930 }, none).ok).toBe(false);
    expect(parseItemPatch({ teamIds: 'a' }, none).ok).toBe(false);
    expect(parseItemPatch({ teamIds: [''] }, none).ok).toBe(false);
  });

  it('clears a date with null or an empty string', () => {
    const r = parseItemPatch({ targetStartDate: '', targetEndDate: null }, none);
    expect(r.ok && r.patch.targetStartDate === null && r.patch.targetEndDate === null).toBe(true);
  });

  it('refuses an end date before the start date, using the stored date for the untouched side', () => {
    expect(parseItemPatch({ targetStartDate: '2026-09-10', targetEndDate: '2026-09-01' }, none).ok).toBe(false);
    const stored = { targetStartDate: new Date('2026-09-10'), targetEndDate: null };
    expect(parseItemPatch({ targetEndDate: '2026-09-01' }, stored).ok).toBe(false);
    expect(parseItemPatch({ targetEndDate: '2026-09-10' }, stored).ok).toBe(true);
    expect(parseItemPatch({ targetEndDate: null }, { targetStartDate: new Date('2026-09-10'), targetEndDate: new Date('2026-09-01') }).ok).toBe(true);
  });
});
