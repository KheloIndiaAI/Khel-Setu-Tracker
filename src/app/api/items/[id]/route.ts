import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAccess } from '@/lib/guards';
import { canManageItems } from '@/lib/permissions';
import { parseItemPatch } from '@/lib/item-edit';

type Ctx = { params: Promise<{ id: string }> };

/** Editing and deleting are Super Admin (OSD) only; the /api/items route rule alone would also let admins and leads in. */
async function guardManage() {
  const guard = await requireApiAccess('/api/items');
  if ('error' in guard) return guard;
  if (!canManageItems(guard.user.role)) {
    return { error: NextResponse.json({ error: 'Only the Super Admin can change or delete items' }, { status: 403 }) } as const;
  }
  return guard;
}

const actor = (user: { id: string; name?: string | null }) => `${user.name ?? 'unknown'} (${user.id})`;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await guardManage();
  if ('error' in guard) return guard.error;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const existing = await prisma.item.findUnique({ where: { id }, include: { team: { select: { id: true } } } });
  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const parsed = parseItemPatch(body, existing);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { teamIds, ...fields } = parsed.patch;

  if (teamIds) {
    const found = await prisma.person.count({ where: { id: { in: teamIds } } });
    if (found !== teamIds.length) return NextResponse.json({ error: 'Unknown team member' }, { status: 400 });
  }

  const before = {
    title: existing.title,
    status: existing.status,
    targetStartDate: existing.targetStartDate,
    targetEndDate: existing.targetEndDate,
    teamIds: existing.team.map((t) => t.id),
  };

  const [item] = await prisma.$transaction([
    prisma.item.update({
      where: { id },
      data: { ...fields, ...(teamIds ? { team: { set: teamIds.map((pid) => ({ id: pid })) } } : {}) },
    }),
    prisma.activityLog.create({
      data: {
        who: actor(guard.user),
        what: `Edited ${existing.type.toLowerCase()} "${existing.title}"`,
        itemId: id,
        before,
        after: { ...before, ...fields, ...(teamIds ? { teamIds } : {}) },
      },
    }),
  ]);

  return NextResponse.json({ success: true, item });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await guardManage();
  if ('error' in guard) return guard.error;
  const { id } = await params;

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  // A parent's delete only NULLs its children's parentId (ON DELETE SET NULL), so collect the whole subtree
  // and remove it explicitly, or the workstreams and tasks would be left behind as orphans.
  const ids = [id];
  let frontier = [id];
  while (frontier.length > 0) {
    const kids = await prisma.item.findMany({ where: { parentId: { in: frontier } }, select: { id: true } });
    frontier = kids.map((k) => k.id).filter((k) => !ids.includes(k));
    ids.push(...frontier);
  }

  await prisma.$transaction([
    // These reference the item with ON DELETE RESTRICT, so they go first.
    prisma.stageGate.deleteMany({ where: { workstreamId: { in: ids } } }),
    prisma.hurdle.deleteMany({ where: { itemId: { in: ids } } }),
    prisma.note.deleteMany({ where: { itemId: { in: ids } } }),
    prisma.document.deleteMany({ where: { itemId: { in: ids } } }),
    // Team and decision links are join rows that cascade on their own.
    prisma.item.deleteMany({ where: { id: { in: ids } } }),
    prisma.activityLog.create({
      data: {
        who: actor(guard.user),
        what: `Deleted ${existing.type.toLowerCase()} "${existing.title}"${ids.length > 1 ? ` and ${ids.length - 1} item(s) under it` : ''}`,
        itemId: id,
        before: { title: existing.title, type: existing.type, status: existing.status, itemsRemoved: ids.length },
      },
    }),
  ]);

  return NextResponse.json({ success: true, removed: ids.length });
}
