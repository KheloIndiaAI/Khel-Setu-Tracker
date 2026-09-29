import { getMissionData } from '@/lib/data';
import LeadClient from './LeadClient';
import { requirePageAccess } from '@/lib/guards';

export default async function LeadPage() {
  const session = { user: await requirePageAccess('/lead') };
  
  // Disable strict auth redirect for prototype testing if session doesn't exist
  // if (!session || session.user.role !== 'LEAD') redirect('/api/auth/signin');
  const user = session?.user || { name: 'Mansi' };

  const data = await getMissionData();
  
  if (!data) {
    return <div className="p-8">No mission data available. Run the seed script and import data.</div>;
  }

  // Filter projects led by the user (mocked to just take first 3 for the prototype since owner isn't fully wired)
  const myProjects = data.projects.slice(0, 3);

  return (
    <LeadClient 
      projects={myProjects} 
      user={user}
    />
  );
}
