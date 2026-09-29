import { requirePageAccess } from '@/lib/guards';
import { getProject } from '@/lib/data';
import ProjectClient from './ProjectClient';
import { prisma } from '@/lib/prisma';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAccess('/project');
  const { id } = await params;
  const project = await getProject(id);
  const people = await prisma.person.findMany();
  
  return <ProjectClient project={project} people={people} />;
}
