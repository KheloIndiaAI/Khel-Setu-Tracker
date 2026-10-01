import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildPlan, planToSql, planTotals, planId, type Plan, type RawRow } from './plan-load';

/** A row with only the cells a test cares about. Columns: 0 pillar, 1 track, 3 activity, 4 sub, 5 start, 6 end, 7 actual, 8 BA, 17 status, 18 remarks, 19 SAI remarks. */
function row(n: number, c: Record<number, string>): RawRow {
  const cells = Array(20).fill('');
  for (const [k, v] of Object.entries(c)) cells[Number(k)] = v;
  return { n, cells };
}

describe('buildPlan', () => {
  const rows: RawRow[] = [
    row(4, { 0: 'A', 1: 'Identity', 3: 'Onboarding', 4: '1. First', 5: '2026-07-01', 6: '2026-07-31', 8: 'Mansi', 17: 'Completed' }),
    row(5, { 0: 'A', 1: 'Identity', 3: 'Onboarding', 4: '2. Second', 5: '2026-09-02', 6: '2026-09-09', 8: 'Mansi', 17: 'In Progress' }),
    // blank Activities cell continues the activity above (like "Integration" under the WhatsApp plan)
    row(6, { 0: 'A', 1: 'Identity', 4: 'Third', 17: '' }),
    row(7, { 0: 'A', 1: 'Identity', 3: 'Lists', 4: '1. One\n2. Two\n\n3. Three', 5: '2026-08-01', 6: '2026-08-31', 8: 'Mansi', 17: 'Parked', 18: 'Waiting for client', 19: 'SAI note', 7: '2026-08-20' }),
    row(8, { 0: 'A', 1: 'Identity', 3: 'No sub tasks', 8: 'Mansi' }),
    row(9, { 0: 'B', 1: 'Other', 3: 'Site', 4: 'Build', 8: 'Gaurav', 17: 'Blocked', 18: 'Waiting for launch' }),
    row(10, { 3: 'Orphan activity' }), // no track: skipped
    row(11, { 0: 'BRD Tracker' }), // stray label: skipped
    row(12, {}), // empty
  ];
  const plan = buildPlan(rows);
  const identity = plan.tracks.find((t) => t.name === 'Identity')!;

  it('maps the three levels and keeps one track per name', () => {
    expect(plan.tracks.map((t) => t.name)).toEqual(['Identity', 'Other']);
    expect(identity.workstreams.map((w) => w.title)).toEqual(['Onboarding', 'Lists', 'No sub tasks']);
    expect(identity.workstreams[0].tasks.map((t) => t.title)).toEqual(['1. First', '2. Second', 'Third']);
  });

  it('splits a multi-line cell into one sub task per non-empty line', () => {
    expect(identity.workstreams[1].tasks.map((t) => t.title)).toEqual(['1. One', '2. Two', '3. Three']);
  });

  it('maps statuses, parked and blocked', () => {
    const [first, second, third] = identity.workstreams[0].tasks;
    expect([first.status, second.status, third.status]).toEqual(['LIVE', 'DOING', 'TO_DO']);
    const lists = identity.workstreams[1];
    expect(lists.tasks.every((t) => t.parked && t.status === 'TO_DO')).toBe(true);
    expect(lists.tasks[0].parkedReason).toBe('Waiting for client');
    const blocked = plan.tracks[1].workstreams[0].tasks[0];
    expect(blocked.status).toBe('DOING');
    expect(blocked.blocked).toBe('Blocked: Waiting for launch');
  });

  it('puts remarks once per row, on the first sub task', () => {
    const [a, b, c] = identity.workstreams[1].tasks;
    expect(a.remarks).toContain('Remarks: Waiting for client');
    expect(a.remarks).toContain('Remarks from the SAI team: SAI note');
    expect(a.remarks).toContain('Actual completion: 20 Aug 2026');
    expect(a.remarks).toContain('3 sub tasks');
    expect(b.remarks).toBeNull();
    expect(c.remarks).toBeNull();
  });

  it('rolls dates, status, parked and owner up the tree', () => {
    const onboarding = identity.workstreams[0];
    expect(onboarding.start).toBe('2026-07-01');
    expect(onboarding.end).toBe('2026-09-09');
    expect(onboarding.status).toBe('DOING');
    expect(onboarding.owner).toBe('Mansi');
    expect(identity.workstreams[1].parked).toBe(true); // every sub task parked
    expect(onboarding.parked).toBe(false);
    expect(identity.start).toBe('2026-07-01');
    expect(identity.end).toBe('2026-09-09');
    expect(plan.tracks[1].owner).toBe('Gaurav');
  });

  it('keeps a workstream that has no sub tasks, and reports what it skipped', () => {
    expect(identity.workstreams[2].tasks).toEqual([]);
    expect(plan.skipped.map((s) => s.row)).toEqual([10, 11]);
  });

  it('rejects things it cannot map instead of guessing', () => {
    expect(() => buildPlan([row(4, { 0: 'A', 1: 'T', 3: 'W', 4: 'x', 17: 'Maybe' })])).toThrow(/unknown status/);
    expect(() => buildPlan([row(4, { 0: 'A', 1: 'T', 3: 'W', 4: 'x', 5: '1 Jul' })])).toThrow(/not a date/);
    expect(() => buildPlan([row(4, { 1: 'T', 3: 'W', 4: 'x' })])).toThrow(/pillar/);
  });
});

describe('planToSql', () => {
  const plan: Plan = buildPlan([
    row(4, { 0: 'A', 1: "Track's name", 3: 'Work', 4: "It's one", 5: '2026-07-01', 6: '2026-07-02', 17: 'Blocked', 18: "can't go" }),
  ]);
  const sql = planToSql(plan, 'test');

  it('is deterministic and escapes quotes', () => {
    expect(planToSql(plan, 'test')).toBe(sql);
    expect(sql).toContain("'Track''s name'");
    expect(sql).toContain("'It''s one'");
    expect(sql).toContain("'Blocked: can''t go'");
  });

  it('only loads into an empty plan', () => {
    expect(sql).toContain('IF EXISTS (SELECT 1 FROM "Item")');
    expect(sql).toContain('RETURN;');
  });

  it('uses stable, distinct ids', () => {
    expect(planId('x')).toBe(planId('x'));
    expect(planId('x')).not.toBe(planId('y'));
    expect(planId('x')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('the committed July-September plan', () => {
  const root = process.cwd();
  const plan: Plan = JSON.parse(readFileSync(join(root, 'prisma', 'plan', 'july-sep-plan.json'), 'utf8'));
  const dir = readdirSync(join(root, 'prisma', 'migrations')).find((d) => d.endsWith('_load_july_sep_plan'))!;
  const sql = readFileSync(join(root, 'prisma', 'migrations', dir, 'migration.sql'), 'utf8');

  it('has the 13 tracks of the sheet, with Identity Platform as exactly one', () => {
    expect(plan.tracks).toHaveLength(13);
    expect(plan.tracks.filter((t) => t.name === 'Khel Setu - Identity Platform')).toHaveLength(1);
    expect(plan.tracks.map((t) => t.name).sort()).toEqual([
      'ACTC',
      'Athlete Management System',
      'Central Monitoring System',
      'DBT and APBS — Entitlement Disbursement',
      'Fit India Platform',
      'Games Management System (GMS)',
      'Grievance Redressal System',
      'Khelo India Website',
      'Khel Setu - Identity Platform',
      'MIS, Reports and Dashboard',
      'Sports Infrastructure Registry',
      'Training Centre Management',
      'Works Management System',
    ].sort());
  });

  it('matches the totals counted from the sheet', () => {
    expect(planTotals(plan)).toEqual({ tracks: 13, workstreams: 52, tasks: 125, parkedTasks: 8, blockedTasks: 5 });
    expect(plan.skipped.map((s) => s.row)).toEqual([63, 87]);
  });

  it('gives every track a pillar and every workstream a unique title within its track', () => {
    for (const t of plan.tracks) {
      expect(t.pillar).toMatch(/^[A-I]$/);
      const titles = t.workstreams.map((w) => w.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  it('has a migration whose row counts equal the plan', () => {
    const totals = planTotals(plan);
    const itemRows = (sql.match(/^ {4}\('[0-9a-f-]{36}', /gm) ?? []).length;
    const pillars = new Set(plan.tracks.map((t) => t.pillar)).size;
    // every inserted row starts with its uuid: pillars, tracks, workstreams, sub tasks, hurdles and the one log entry
    expect(itemRows).toBe(pillars + totals.tracks + totals.workstreams + totals.tasks + totals.blockedTasks + 1);
    expect(pillars).toBe(8);
  });
});
