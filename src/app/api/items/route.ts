import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAccess } from '@/lib/guards';

export async function POST(req: NextRequest) {
  const guard = await requireApiAccess('/api/items');
  if ('error' in guard) return guard.error;

  try {
    const body = await req.json();
    const { title, parentId, type, status, targetStartDate, targetEndDate } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Missing title or type' }, { status: 400 });
    }

    const newItem = await prisma.item.create({
      data: {
        title,
        type,
        status: status || 'TO_DO',
        parentId: parentId || null,
        parked: false,
        weight: 1,
        targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
        targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
        ...(body.teamIds && body.teamIds.length > 0 ? {
          team: {
            connect: body.teamIds.map((id: string) => ({ id }))
          }
        } : {})
      }
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
