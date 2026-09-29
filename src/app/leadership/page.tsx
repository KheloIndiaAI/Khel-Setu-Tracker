import { getMissionData } from '@/lib/data';
import TrackClient from './TrackClient';
import { calculateMissionHeadline } from '@/lib/progress';
import { prisma } from '@/lib/prisma';
import { requirePageAccess } from '@/lib/guards';

export default async function LeadershipPage() {
  await requirePageAccess('/leadership');
  const data = await getMissionData();
  const people = await prisma.person.findMany();
  
  if (!data) {
    return <div className="p-8">No mission data available. Run the seed script and import data.</div>;
  }

  const headline = calculateMissionHeadline({
    actual: data.missionActual,
    startDate: data.mission.startDate,
    targetDate: data.mission.targetDate
  }, new Date());

  const daysElapsed = Math.max(0, Math.floor((new Date().getTime() - data.mission.startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.max(0, Math.floor((data.mission.targetDate.getTime() - data.mission.startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <TrackClient 
      projects={data.projects} 
      mission={data.mission} 
      headline={{ ...headline, daysElapsed, totalDays }} 
      people={people}
    />
  );
}
