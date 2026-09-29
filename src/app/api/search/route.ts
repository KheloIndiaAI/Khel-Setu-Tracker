import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAccess } from '@/lib/guards';

export async function GET(req: NextRequest) {
  const guard = await requireApiAccess('/api/search');
  if ('error' in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) return NextResponse.json([]);

  const results = await prisma.item.findMany({
    where: {
      title: { contains: q, mode: 'insensitive' }
    },
    take: 10,
    include: {
      parent: {
        include: { parent: true }
      }
    }
  });

  const formatted = results.map(r => {
    // Determine the root project ID so clicking the search result navigates to the project page
    let projectId = null;
    let parentTitle = null;

    if (r.type === 'PROJECT') {
      projectId = r.id;
    } else if (r.type === 'WORKSTREAM' && r.parent) {
      projectId = r.parent.id;
      parentTitle = r.parent.title;
    } else if (r.type === 'TASK' && r.parent) {
      projectId = r.parent.parentId; // The workstream's parent
      parentTitle = r.parent.title;
    }

    return {
      id: r.id,
      title: r.title,
      type: r.type,
      projectId,
      parentTitle
    };
  });

  return NextResponse.json(formatted);
}
