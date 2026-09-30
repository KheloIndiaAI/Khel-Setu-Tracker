/**
 * Validation for editing a track / workstream / task. Pure (no DB, no Next imports) so it can be unit-tested.
 * Only the fields listed here can be changed through PATCH /api/items/[id].
 */
export const ITEM_STATUSES = ['TO_DO', 'DOING', 'IN_REVIEW', 'ACCEPTED', 'LIVE'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type ItemPatch = {
  title?: string;
  status?: ItemStatus;
  targetStartDate?: Date | null;
  targetEndDate?: Date | null;
  teamIds?: string[];
};

export type PatchResult = { ok: true; patch: ItemPatch } | { ok: false; error: string };

const ALLOWED_KEYS = ['title', 'status', 'targetStartDate', 'targetEndDate', 'teamIds'];
const MAX_TITLE = 200;
const MAX_TEAM = 200;

function parseDate(value: unknown): Date | null | 'invalid' {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return 'invalid';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'invalid' : d;
}

export function parseItemPatch(
  body: unknown,
  current: { targetStartDate: Date | null; targetEndDate: Date | null },
): PatchResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Send a JSON object' };
  }
  const input = body as Record<string, unknown>;
  const unknownKeys = Object.keys(input).filter((k) => !ALLOWED_KEYS.includes(k));
  if (unknownKeys.length > 0) return { ok: false, error: `Cannot change: ${unknownKeys.join(', ')}` };
  if (Object.keys(input).length === 0) return { ok: false, error: 'Nothing to change' };

  const patch: ItemPatch = {};

  if ('title' in input) {
    if (typeof input.title !== 'string') return { ok: false, error: 'Title must be text' };
    const title = input.title.trim();
    if (title.length < 1 || title.length > MAX_TITLE) {
      return { ok: false, error: `Title must be 1 to ${MAX_TITLE} characters` };
    }
    patch.title = title;
  }

  if ('status' in input) {
    if (!(ITEM_STATUSES as readonly unknown[]).includes(input.status)) {
      return { ok: false, error: 'Unknown status' };
    }
    patch.status = input.status as ItemStatus;
  }

  if ('targetStartDate' in input) {
    const d = parseDate(input.targetStartDate);
    if (d === 'invalid') return { ok: false, error: 'Start date is not a valid date' };
    patch.targetStartDate = d;
  }

  if ('targetEndDate' in input) {
    const d = parseDate(input.targetEndDate);
    if (d === 'invalid') return { ok: false, error: 'End date is not a valid date' };
    patch.targetEndDate = d;
  }

  if ('teamIds' in input) {
    const ids = input.teamIds;
    if (!Array.isArray(ids) || ids.length > MAX_TEAM || !ids.every((x) => typeof x === 'string' && x.length > 0)) {
      return { ok: false, error: 'Team must be a list of person ids' };
    }
    patch.teamIds = [...new Set(ids as string[])];
  }

  const start = 'targetStartDate' in patch ? patch.targetStartDate : current.targetStartDate;
  const end = 'targetEndDate' in patch ? patch.targetEndDate : current.targetEndDate;
  if (start && end && end.getTime() < start.getTime()) {
    return { ok: false, error: 'End date cannot be before the start date' };
  }

  return { ok: true, patch };
}
