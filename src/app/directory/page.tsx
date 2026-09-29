import DirectoryClient from './DirectoryClient';
import { prisma } from '@/lib/prisma';
import { requirePageAccess } from '@/lib/guards';

export default async function DirectoryPage() {
  const me = await requirePageAccess('/directory');
  const people = await prisma.person.findMany({
    where: { role: { not: 'SUPER_ADMIN' } },
    orderBy: { name: 'asc' },
    include: {
      projects: {
        where: {
          status: { in: ['DOING', 'TO_DO'] }
        },
        select: {
          id: true,
          title: true,
          type: true
        }
      }
    }
  });

  // map projects to teamItems so DirectoryClient matches
  const formatted = people.map(p => ({
    ...p,
    teamItems: p.projects
  }));

  return <DirectoryClient people={formatted} meId={me.id} />;
}
