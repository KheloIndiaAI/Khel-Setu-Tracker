import { prisma } from './prisma';
import { calculateActual, calculatePacer, ItemProgressData, Status, withWorkstreamProgress } from './progress';

export async function getProjectsWithProgress(today: Date = new Date()) {
  const projects = await prisma.item.findMany({
    where: { type: 'PROJECT' },
    include: {
      pillar: true,
      team: { select: { id: true } },
      children: { // Workstreams
        include: {
          team: { select: { id: true } },
          children: { // Tasks
            include: {
              hurdles: true,
              team: { select: { id: true } }
            }
          }
        }
      },
      hurdles: true
    },
    orderBy: [
      { pillar: { letter: 'asc' } },
      { title: 'asc' }
    ]
  });

  return projects.map(proj => {
    // Map to ItemProgressData
    const progressData: ItemProgressData = {
      id: proj.id,
      status: proj.status as Status,
      weight: proj.weight,
      parked: proj.parked,
      targetStartDate: proj.targetStartDate,
      targetEndDate: proj.targetEndDate,
      children: proj.children.map(ws => ({
        id: ws.id,
        status: ws.status as Status,
        weight: ws.weight,
        parked: ws.parked,
        targetStartDate: ws.targetStartDate,
        targetEndDate: ws.targetEndDate,
        children: ws.children.map(task => ({
          id: task.id,
          status: task.status as Status,
          weight: task.weight,
          parked: task.parked,
          targetStartDate: task.targetStartDate,
          targetEndDate: task.targetEndDate,
        }))
      }))
    };

    const actual = calculateActual(progressData);
    const pacer = calculatePacer(progressData, today);

    // Flatten hurdles from project, workstream, task levels
    const allHurdles = [
      ...proj.hurdles,
      ...proj.children.flatMap(ws => ws.children.flatMap(t => t.hurdles))
    ];

    return {
      ...proj,
      children: withWorkstreamProgress(proj.children, today),
      actual,
      pacer,
      allHurdles
    };
  });
}

export async function getMissionData(today: Date = new Date()) {
  const mission = await prisma.mission.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  if (!mission) return null;

  const projects = await getProjectsWithProgress(today);
  
  // Calculate mission overall progress
  // Assumption: Equal weights for projects
  const totalWeight = projects.length;
  let totalActual = 0;
  for (const p of projects) totalActual += p.actual;
  const missionActual = totalWeight > 0 ? totalActual / totalWeight : 0;

  return {
    mission,
    missionActual,
    projects
  };
}

export async function getProject(id: string, today: Date = new Date()) {
  const proj = await prisma.item.findUnique({
    where: { id },
    include: {
      pillar: true,
      team: { select: { id: true } },
      children: { // Workstreams
        include: {
          team: { select: { id: true } },
          children: { // Tasks
            include: {
              hurdles: true,
              team: { select: { id: true } }
            }
          }
        }
      },
      hurdles: true,
      decisions: {
        orderBy: { date: 'desc' }
      },
      documents: {
        orderBy: { version: 'desc' }
      }
    }
  });

  if (!proj) return null;

  const progressData: any = {
    id: proj.id,
    status: proj.status,
    weight: proj.weight,
    parked: proj.parked,
    targetStartDate: proj.targetStartDate,
    targetEndDate: proj.targetEndDate,
    children: proj.children.map(ws => ({
      id: ws.id,
      status: ws.status,
      weight: ws.weight,
      parked: ws.parked,
      targetStartDate: ws.targetStartDate,
      targetEndDate: ws.targetEndDate,
      children: ws.children.map(task => ({
        id: task.id,
        status: task.status,
        weight: task.weight,
        parked: task.parked,
        targetStartDate: task.targetStartDate,
        targetEndDate: task.targetEndDate,
      }))
    }))
  };

  const actual = calculateActual(progressData);
  const pacer = calculatePacer(progressData, today);
  const allHurdles = [
    ...proj.hurdles,
    ...proj.children.flatMap(ws => ws.children.flatMap(t => t.hurdles))
  ];

  return {
    ...proj,
    children: withWorkstreamProgress(proj.children, today),
    actual,
    pacer,
    allHurdles
  };
}

export async function getMyDayData(userId?: string) {
  // If no user provided, just grab the first user who has tasks, or fallback to any tasks.
  const myTasks = await prisma.item.findMany({
    where: { 
      type: 'TASK',
      // If we had real auth, we'd filter by ownerId. 
      // For demo, we just fetch a few tasks to populate the UI.
    },
    take: 5,
    include: {
      parent: true,
      hurdles: true
    }
  });

  return {
    tasks: myTasks.map(t => ({
      id: t.id,
      title: t.title,
      ws: t.parent?.title || 'Unknown workstream',
      status: t.status,
      // map status to 0, 1, 2 for the UI state machine
      s: t.status === 'TO_DO' ? 0 : (t.status === 'DOING' ? 1 : 2),
      s0: t.status === 'TO_DO' ? 0 : (t.status === 'DOING' ? 1 : 2),
      on: true
    }))
  };
}
