/**
 * Builds the one-time plan-load migration from the "Micro Monthly Plan July-Sep" sheet.
 *   npx tsx src/scripts/build-plan.ts "<path to the .xlsx>"
 * Writes prisma/plan/july-sep-plan.json (the readable record) and the migration folder, then prints the totals.
 */
import ExcelJS from 'exceljs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPlan, planToSql, planTotals, type RawRow } from '../lib/plan-load';

const SHEET = /July/i;
const MIGRATION = '20261001100100_load_july_sep_plan';

function cellText(c: ExcelJS.Cell): string {
  const v = c.value as unknown;
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as { richText?: { text: string }[]; result?: unknown; text?: string };
    if (o.richText) return o.richText.map((r) => r.text).join('');
    if (o.result !== undefined) return String(o.result);
    if (o.text) return o.text;
  }
  return String(v);
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: tsx src/scripts/build-plan.ts "<path to the .xlsx>"');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets.find((w) => SHEET.test(w.name));
  if (!ws) throw new Error(`No sheet matching ${SHEET} in ${file}`);

  const rows: RawRow[] = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    // Merged cells report the merged value on every cell they cover, which is what the fill-down needs.
    const cells = Array.from({ length: 20 }, (_, i) => cellText(row.getCell(i + 1)));
    rows.push({ n, cells });
  });

  const plan = buildPlan(rows);
  const totals = planTotals(plan);

  const root = process.cwd();
  mkdirSync(join(root, 'prisma', 'plan'), { recursive: true });
  writeFileSync(join(root, 'prisma', 'plan', 'july-sep-plan.json'), JSON.stringify(plan, null, 2) + '\n');

  const dir = join(root, 'prisma', 'migrations', MIGRATION);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'migration.sql'), planToSql(plan, 'July-September 2026 micro monthly'));

  console.log('Totals:', totals);
  console.log('Skipped rows:', plan.skipped);
  for (const t of plan.tracks) {
    console.log(`${t.pillar}  ${t.name}  [${t.workstreams.length} workstreams, ${t.workstreams.reduce((s, w) => s + w.tasks.length, 0)} sub tasks]`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
