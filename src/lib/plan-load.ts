/**
 * Turns the "Micro Monthly Plan July-Sep" sheet into the platform's three levels and into SQL.
 *   Name of Portal / Project -> track     (Item type PROJECT)
 *   Activities               -> workstream (Item type WORKSTREAM)
 *   Sub-Activities           -> sub task   (Item type TASK; one per line of the cell)
 * Pure (no DB, no file access) so it can be unit-tested. The CLI that reads the .xlsx is src/scripts/build-plan.ts.
 */
import { createHash } from 'node:crypto';

/** One sheet row: its 1-based row number and its 20 cells (A..T) as text, merged cells already filled in. */
export type RawRow = { n: number; cells: string[] };

export type PlanStatus = 'TO_DO' | 'DOING' | 'LIVE';

export type PlanTask = {
  row: number;
  title: string;
  status: PlanStatus;
  parked: boolean;
  parkedReason: string | null;
  start: string | null;
  end: string | null;
  owner: string | null;
  remarks: string | null;
  /** Set when the plan marks the row Blocked: the text of the hurdle to raise. */
  blocked: string | null;
};

export type PlanWorkstream = {
  title: string;
  status: PlanStatus;
  parked: boolean;
  parkedReason: string | null;
  start: string | null;
  end: string | null;
  owner: string | null;
  remarks: string | null;
  tasks: PlanTask[];
};

export type PlanTrack = {
  name: string;
  pillar: string;
  status: PlanStatus;
  parked: boolean;
  start: string | null;
  end: string | null;
  owner: string | null;
  workstreams: PlanWorkstream[];
};

export type Plan = {
  tracks: PlanTrack[];
  /** Sheet rows that were left out, with the reason, so nothing disappears silently. */
  skipped: { row: number; reason: string }[];
};

// Column positions (0-based) in the sheet.
const COL = { pillar: 0, track: 1, activity: 3, sub: 4, start: 5, end: 6, actual: 7, ba: 8, status: 17, remarks: 18, remarksSai: 19 };
const FIRST_DATA_ROW = 4;

const clean = (s: string | undefined) =>
  (s ?? '').replace(/[​⁠﻿]/g, '').replace(/ /g, ' ').replace(/\r/g, '');
/** One-line text: zero-width characters dropped, whitespace collapsed. */
const oneLine = (s: string | undefined) => clean(s).replace(/\s+/g, ' ').trim();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function dateOrNull(s: string | undefined, row: number, label: string): string | null {
  const v = oneLine(s);
  if (!v) return null;
  if (!ISO_DATE.test(v)) throw new Error(`Row ${row}: ${label} "${v}" is not a date (expected YYYY-MM-DD)`);
  return v;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const prettyDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

type Mapped = { status: PlanStatus; parked: boolean; blocked: boolean };
function mapStatus(raw: string, row: number): Mapped {
  switch (oneLine(raw).toLowerCase()) {
    case '': return { status: 'TO_DO', parked: false, blocked: false };
    case 'yet to start': return { status: 'TO_DO', parked: false, blocked: false };
    case 'in progress': return { status: 'DOING', parked: false, blocked: false };
    case 'completed': return { status: 'LIVE', parked: false, blocked: false };
    case 'parked': return { status: 'TO_DO', parked: true, blocked: false };
    case 'blocked': return { status: 'DOING', parked: false, blocked: true };
    default: throw new Error(`Row ${row}: unknown status "${raw}"`);
  }
}

/** A parent's status from its active (not parked) children: all live -> live, any progress -> doing, else to do. */
function rollUp(children: { status: PlanStatus; parked: boolean }[]): PlanStatus {
  const active = children.filter((c) => !c.parked);
  if (active.length === 0) return 'TO_DO';
  if (active.every((c) => c.status === 'LIVE')) return 'LIVE';
  if (active.some((c) => c.status === 'DOING' || c.status === 'LIVE')) return 'DOING';
  return 'TO_DO';
}

const minDate = (xs: (string | null)[]) => xs.filter((x): x is string => !!x).sort()[0] ?? null;
const maxDate = (xs: (string | null)[]) => xs.filter((x): x is string => !!x).sort().slice(-1)[0] ?? null;

/** The one BA named across the rows below, or null when there is none or they differ. */
function sharedOwner(owners: (string | null)[]): string | null {
  const names = new Set(owners.filter((o): o is string => !!o));
  return names.size === 1 ? [...names][0] : null;
}

function remarksFor(cells: string[], splitInto: number): string | null {
  const parts: string[] = [];
  const remark = clean(cells[COL.remarks]).trim();
  const sai = clean(cells[COL.remarksSai]).trim();
  const actual = dateOrNull(cells[COL.actual], 0, 'actual completion date');
  if (remark) parts.push(`Remarks: ${remark}`);
  if (sai) parts.push(`Remarks from the SAI team: ${sai}`);
  if (actual) parts.push(`Actual completion: ${prettyDate(actual)}`);
  if (parts.length === 0) return null;
  if (splitInto > 1) parts.push(`(This row of the plan listed ${splitInto} sub tasks in one cell; these remarks cover all of them.)`);
  return parts.join('\n');
}

export function buildPlan(rows: RawRow[]): Plan {
  const skipped: Plan['skipped'] = [];
  const tracks = new Map<string, { pillar: string; workstreams: Map<string, PlanWorkstream> }>();
  const lastActivity = new Map<string, string>();

  for (const { n, cells } of rows) {
    if (n < FIRST_DATA_ROW) continue;
    const trackName = oneLine(cells[COL.track]);
    const activityCell = oneLine(cells[COL.activity]);
    const subText = clean(cells[COL.sub]);
    const subLines = subText.split('\n').map((l) => oneLine(l)).filter(Boolean);

    if (!activityCell && subLines.length === 0) {
      // Empty rows and the stray "BRD Tracker" label have no activity and no sub-activity.
      if (trackName || oneLine(cells[COL.pillar])) skipped.push({ row: n, reason: 'no activity or sub-activity' });
      continue;
    }
    if (!trackName) {
      skipped.push({ row: n, reason: `no "Name of Portal / Project" (${activityCell || subLines[0]})` });
      continue;
    }

    // A blank Activities cell continues the activity above it within the same track.
    const activity = activityCell || lastActivity.get(trackName) || '';
    if (!activity) {
      skipped.push({ row: n, reason: 'no activity and none above it in the track' });
      continue;
    }
    lastActivity.set(trackName, activity);

    const pillar = oneLine(cells[COL.pillar]);
    let track = tracks.get(trackName);
    if (!track) {
      if (!/^[A-Z]$/.test(pillar)) throw new Error(`Row ${n}: track "${trackName}" has no pillar letter ("${pillar}")`);
      track = { pillar, workstreams: new Map() };
      tracks.set(trackName, track);
    } else if (pillar && pillar !== track.pillar) {
      throw new Error(`Row ${n}: track "${trackName}" is in pillar ${track.pillar} above but ${pillar} here`);
    }

    let ws = track.workstreams.get(activity);
    if (!ws) {
      ws = { title: activity, status: 'TO_DO', parked: false, parkedReason: null, start: null, end: null, owner: null, remarks: null, tasks: [] };
      track.workstreams.set(activity, ws);
    }

    const start = dateOrNull(cells[COL.start], n, 'start date');
    const end = dateOrNull(cells[COL.end], n, 'end date');
    const owner = oneLine(cells[COL.ba]) || null;
    const mapped = mapStatus(cells[COL.status], n);
    const remarkText = oneLine(cells[COL.remarks]);

    if (subLines.length === 0) {
      // A workstream on its own row: it keeps the row's own dates, owner, status and remarks.
      ws.start = start;
      ws.end = end;
      ws.owner = owner;
      ws.status = mapped.status;
      ws.remarks = remarksFor(cells, 1);
      continue;
    }

    subLines.forEach((title, i) => {
      ws.tasks.push({
        row: n,
        title,
        status: mapped.status,
        parked: mapped.parked,
        parkedReason: mapped.parked ? remarkText || null : null,
        start,
        end,
        owner,
        // Remarks are kept once per row, on its first sub task, so a ten-line cell does not repeat them ten times.
        remarks: i === 0 ? remarksFor(cells, subLines.length) : null,
        blocked: mapped.blocked ? (remarkText ? `Blocked: ${remarkText}` : 'Blocked, as marked in the plan') : null,
      });
    });
  }

  const out: PlanTrack[] = [];
  for (const [name, t] of tracks) {
    const workstreams = [...t.workstreams.values()];
    for (const ws of workstreams) {
      if (ws.tasks.length > 0) {
        ws.status = rollUp(ws.tasks);
        ws.parked = ws.tasks.every((x) => x.parked);
        ws.parkedReason = ws.parked ? ws.tasks.find((x) => x.parkedReason)?.parkedReason ?? null : null;
        ws.start = minDate(ws.tasks.map((x) => x.start));
        ws.end = maxDate(ws.tasks.map((x) => x.end));
        ws.owner = sharedOwner(ws.tasks.map((x) => x.owner));
      }
    }
    out.push({
      name,
      pillar: t.pillar,
      status: rollUp(workstreams),
      parked: workstreams.length > 0 && workstreams.every((w) => w.parked),
      start: minDate(workstreams.map((w) => w.start)),
      end: maxDate(workstreams.map((w) => w.end)),
      owner: sharedOwner(workstreams.map((w) => w.owner)),
      workstreams,
    });
  }
  return { tracks: out, skipped };
}

export function planTotals(plan: Plan) {
  const workstreams = plan.tracks.flatMap((t) => t.workstreams);
  const tasks = workstreams.flatMap((w) => w.tasks);
  return {
    tracks: plan.tracks.length,
    workstreams: workstreams.length,
    tasks: tasks.length,
    parkedTasks: tasks.filter((t) => t.parked).length,
    blockedTasks: tasks.filter((t) => t.blocked).length,
  };
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

/** Stable UUID (v5 layout) so the generated migration is identical every time it is built. */
export function planId(path: string): string {
  const h = createHash('sha1').update(`khel-setu-plan:${path}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

const q = (s: string | null) => (s === null ? 'NULL' : `'${s.replace(/'/g, "''")}'`);
const d = (s: string | null) => (s === null ? 'NULL' : `'${s} 00:00:00'`);
const b = (v: boolean) => (v ? 'true' : 'false');

type ItemRow = {
  id: string; title: string; type: 'PROJECT' | 'WORKSTREAM' | 'TASK'; parentId: string | null; owner: string | null;
  start: string | null; end: string | null; status: PlanStatus; parked: boolean; parkedReason: string | null;
  pillar: string | null; remarks: string | null;
};

const itemValues = (r: ItemRow) =>
  `(${q(r.id)}, ${q(r.title)}, '${r.type}', ${q(r.parentId)}, ${q(r.owner)}, ${d(r.start)}, ${d(r.end)}, '${r.status}', 1, ${b(r.parked)}, ${q(r.parkedReason)}, '{}', ` +
  `${r.pillar === null ? 'NULL' : `(SELECT "id" FROM "Pillar" WHERE "letter" = ${q(r.pillar)})`}, ${q(r.remarks)})`;

const ITEM_COLUMNS =
  '("id", "title", "type", "parentId", "ownerName", "targetStartDate", "targetEndDate", "status", "weight", "parked", "parkedReason", "evidenceLinks", "pillarId", "remarks")';

export function planToSql(plan: Plan, sourceLabel: string): string {
  const totals = planTotals(plan);
  const trackRows: ItemRow[] = [];
  const wsRows: ItemRow[] = [];
  const taskRows: ItemRow[] = [];
  const hurdleRows: { id: string; itemId: string; text: string; who: string }[] = [];

  for (const t of plan.tracks) {
    const tid = planId(`track:${t.name}`);
    trackRows.push({ id: tid, title: t.name, type: 'PROJECT', parentId: null, owner: t.owner, start: t.start, end: t.end, status: t.status, parked: t.parked, parkedReason: null, pillar: t.pillar, remarks: null });
    for (const w of t.workstreams) {
      const wid = planId(`workstream:${t.name}:${w.title}`);
      wsRows.push({ id: wid, title: w.title, type: 'WORKSTREAM', parentId: tid, owner: w.owner, start: w.start, end: w.end, status: w.status, parked: w.parked, parkedReason: w.parkedReason, pillar: null, remarks: w.remarks });
      w.tasks.forEach((k, i) => {
        const kid = planId(`task:${t.name}:${w.title}:${i}:${k.title}`);
        taskRows.push({ id: kid, title: k.title, type: 'TASK', parentId: wid, owner: k.owner, start: k.start, end: k.end, status: k.status, parked: k.parked, parkedReason: k.parkedReason, pillar: null, remarks: k.remarks });
        if (k.blocked) hurdleRows.push({ id: planId(`hurdle:${kid}`), itemId: kid, text: k.blocked, who: k.owner ?? 'Unassigned' });
      });
    }
  }

  const pillars = [...new Set(plan.tracks.map((t) => t.pillar))].sort();
  const summary = `Loaded the ${sourceLabel} plan: ${totals.tracks} tracks, ${totals.workstreams} workstreams, ${totals.tasks} sub tasks`;

  const lines: string[] = [];
  lines.push(`-- One-time load of the ${sourceLabel} plan (generated by src/scripts/build-plan.ts; do not edit by hand).`);
  lines.push(`-- ${totals.tracks} tracks, ${totals.workstreams} workstreams, ${totals.tasks} sub tasks, ${hurdleRows.length} hurdles.`);
  lines.push('-- It only runs on an empty plan: if any item already exists the whole block is skipped, so a re-run or a');
  lines.push('-- database that already holds data is never changed or duplicated.');
  lines.push('DO $plan$');
  lines.push('BEGIN');
  lines.push('  IF EXISTS (SELECT 1 FROM "Item") THEN');
  lines.push("    RAISE NOTICE 'Plan load skipped: the Item table already has rows.';");
  lines.push('    RETURN;');
  lines.push('  END IF;');
  lines.push('');
  lines.push('  IF NOT EXISTS (SELECT 1 FROM "Mission") THEN');
  lines.push('    INSERT INTO "Mission" ("id", "name", "startDate", "targetDate", "originalTargetDate")');
  lines.push(`    VALUES (${q(planId('mission'))}, 'Q1 Mission', '2026-07-01 00:00:00', '2026-09-30 00:00:00', '2026-09-30 00:00:00');`);
  lines.push('  END IF;');
  lines.push('');
  lines.push('  INSERT INTO "Pillar" ("id", "letter", "name") VALUES');
  lines.push(pillars.map((p) => `    (${q(planId(`pillar:${p}`))}, ${q(p)}, '')`).join(',\n'));
  lines.push('  ON CONFLICT ("letter") DO NOTHING;');
  lines.push('');
  for (const [label, rows] of [['tracks', trackRows], ['workstreams', wsRows], ['sub tasks', taskRows]] as const) {
    lines.push(`  -- ${label}`);
    lines.push(`  INSERT INTO "Item" ${ITEM_COLUMNS} VALUES`);
    lines.push(rows.map((r) => `    ${itemValues(r)}`).join(',\n') + ';');
    lines.push('');
  }
  if (hurdleRows.length > 0) {
    lines.push('  -- blockers raised for rows the plan marks Blocked');
    lines.push('  INSERT INTO "Hurdle" ("id", "itemId", "text", "whoClears", "ownerNameBody") VALUES');
    lines.push(hurdleRows.map((h) => `    (${q(h.id)}, ${q(h.itemId)}, ${q(h.text)}, 'UNOWNED', ${q(h.who)})`).join(',\n') + ';');
    lines.push('');
  }
  lines.push('  INSERT INTO "ActivityLog" ("id", "who", "what", "after") VALUES');
  lines.push(`    (${q(planId('activity-log'))}, 'system (plan load migration)', ${q(summary)}, ${q(JSON.stringify(totals))}::jsonb);`);
  lines.push('END');
  lines.push('$plan$;');
  lines.push('');
  return lines.join('\n');
}
