import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectsWithProgress } from '@/lib/data';
import { requireApiAccess } from '@/lib/guards';
import { timingSafeEqual } from 'crypto';

function bearerMatches(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  // Scheduler: 'Authorization: Bearer $CRON_SECRET'. Otherwise a signed-in admin is required.
  if (!bearerMatches(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    const guard = await requireApiAccess('/api/cron');
    if ('error' in guard) return guard.error;
  }

  const today = new Date();
  const projects = await getProjectsWithProgress(today);

  // Take snapshot of each project
  for (const p of projects) {
    await prisma.dailySnapshot.create({
      data: {
        date: today,
        plannedPct: p.pacer,
        actualPct: p.actual,
        scopeTotal: 0, // Mock scope
        projectId: p.id
      }
    });
  }

  // Mission level
  const totalWeight = projects.length;
  let totalActual = 0;
  let totalPacer = 0;
  for (const p of projects) {
    totalActual += p.actual;
    totalPacer += p.pacer;
  }
  const missionActual = totalWeight > 0 ? totalActual / totalWeight : 0;
  const missionPacer = totalWeight > 0 ? totalPacer / totalWeight : 0;

  await prisma.dailySnapshot.create({
    data: {
      date: today,
      plannedPct: missionPacer,
      actualPct: missionActual,
      scopeTotal: 0,
      projectId: null // null means mission level
    }
  });

  return NextResponse.json({ success: true, message: `Created snapshots for ${projects.length} projects and 1 mission.` });
}
