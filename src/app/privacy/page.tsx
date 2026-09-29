import PrivacyClient from './PrivacyClient';
import { requirePageAccess } from '@/lib/guards';

export default async function PrivacyPage() {
  await requirePageAccess('/privacy');
  return <PrivacyClient />;
}
