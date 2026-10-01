export enum Status {
  TO_DO = 'TO_DO',
  DOING = 'DOING',
  IN_REVIEW = 'IN_REVIEW',
  ACCEPTED = 'ACCEPTED',
  LIVE = 'LIVE',
}

export type ItemProgressData = {
  id: string;
  status: Status;
  weight: number;
  parked: boolean;
  targetStartDate: Date | null;
  targetEndDate: Date | null;
  children?: ItemProgressData[];
};

export const STATUS_VALUES: Record<Status, number> = {
  [Status.TO_DO]: 0,
  [Status.DOING]: 25,
  [Status.IN_REVIEW]: 60,
  [Status.ACCEPTED]: 90,
  [Status.LIVE]: 100,
};

// Actual % of a parent is the size-weighted average of its children. Parked items are excluded.
export function calculateActual(item: ItemProgressData): number {
  if (item.parked) return 0;
  
  if (!item.children || item.children.length === 0) {
    return STATUS_VALUES[item.status] || 0;
  }
  
  const activeChildren = item.children.filter(c => !c.parked);
  if (activeChildren.length === 0) {
    // If all children are parked, default to the parent's own status value
    return STATUS_VALUES[item.status] || 0;
  }
  
  let totalWeight = 0;
  let totalWeightedActual = 0;
  
  for (const child of activeChildren) {
    const childActual = calculateActual(child);
    totalWeight += child.weight;
    totalWeightedActual += childActual * child.weight;
  }
  
  return totalWeight === 0 ? 0 : totalWeightedActual / totalWeight;
}

// Pacer % (planned) of a task on date D is 0 before its start, 100 after its end, and a straight line between the two. Roll it up the same way.
export function calculatePacer(item: ItemProgressData, today: Date): number {
  if (item.parked) return 0;
  
  if (!item.children || item.children.length === 0) {
    if (!item.targetStartDate || !item.targetEndDate) {
      return 0; // Or 100 if we consider no dates = done? The brief says 0 before start, 100 after end. 0 makes sense if no dates.
    }
    
    const start = item.targetStartDate.getTime();
    const end = item.targetEndDate.getTime();
    const now = today.getTime();
    
    if (now <= start) return 0;
    if (now >= end) return 100;
    
    const totalDuration = end - start;
    if (totalDuration === 0) return 100;
    
    const elapsed = now - start;
    return (elapsed / totalDuration) * 100;
  }
  
  const activeChildren = item.children.filter(c => !c.parked);
  if (activeChildren.length === 0) return 0; // or calculate own pacer? Let's just roll up 0.
  
  let totalWeight = 0;
  let totalWeightedPacer = 0;
  
  for (const child of activeChildren) {
    const childPacer = calculatePacer(child, today);
    totalWeight += child.weight;
    totalWeightedPacer += childPacer * child.weight;
  }
  
  return totalWeight === 0 ? 0 : totalWeightedPacer / totalWeight;
}

export type MissionProgressData = {
  actual: number; // 0-100
  startDate: Date;
  targetDate: Date;
};

export type MissionHeadline = {
  remaining: number;
  daysLeft: number;
  neededPerDay: number;
  averageSoFar: number;
  forecastFinish: Date;
};

export function calculateMissionHeadline(mission: MissionProgressData, today: Date): MissionHeadline {
  const remaining = Math.max(0, 100 - mission.actual);
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(0, (mission.targetDate.getTime() - today.getTime()) / msPerDay);
  
  const neededPerDay = daysLeft > 0 ? remaining / daysLeft : remaining;
  
  const daysElapsed = Math.max(0, (today.getTime() - mission.startDate.getTime()) / msPerDay);
  const averageSoFar = daysElapsed > 0 ? mission.actual / daysElapsed : 0;
  
  let forecastFinish = new Date(today);
  if (averageSoFar > 0 && remaining > 0) {
    const daysToFinish = remaining / averageSoFar;
    forecastFinish = new Date(today.getTime() + daysToFinish * msPerDay);
  } else if (remaining === 0) {
    forecastFinish = today;
  } else {
    // If average is 0 and we have remaining work, it will theoretically never finish.
    // For now, set it to a distant future or null. We'll add 10 years.
    forecastFinish = new Date(today.getTime() + 3650 * msPerDay);
  }
  
  return {
    remaining,
    daysLeft,
    neededPerDay,
    averageSoFar,
    forecastFinish,
  };
}

/** Anything with the fields progress needs, such as a Prisma item that carries its children. */
export type ProgressItem = {
  id: string;
  status: string;
  weight: number;
  parked: boolean;
  targetStartDate: Date | null;
  targetEndDate: Date | null;
  children?: ProgressItem[];
};

const toProgressData = (i: ProgressItem): ItemProgressData => ({
  id: i.id,
  status: i.status as Status,
  weight: i.weight,
  parked: i.parked,
  targetStartDate: i.targetStartDate,
  targetEndDate: i.targetEndDate,
  children: i.children?.map(toProgressData),
});

/** Adds actual and planned % to each workstream, from its sub tasks, by the same rules as the track bar. */
export function withWorkstreamProgress<W extends ProgressItem>(workstreams: W[], today: Date): (W & { actual: number; pacer: number })[] {
  return workstreams.map((ws) => {
    const data = toProgressData(ws);
    return { ...ws, actual: calculateActual(data), pacer: calculatePacer(data, today) };
  });
}
