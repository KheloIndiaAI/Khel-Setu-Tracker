import { getMyDayData } from '@/lib/data';
import MyDayClient from './MyDayClient';
import { requirePageAccess } from '@/lib/guards';

export default async function MyDayPage() {
  await requirePageAccess('/my-day');
  const data = await getMyDayData();
  
  return <MyDayClient initialTasks={data.tasks} />;
}
