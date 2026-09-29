import OwnerEmailClient from './OwnerEmailClient';
import { requirePageAccess } from '@/lib/guards';

export default async function OwnerEmailPage() {
  await requirePageAccess('/owner-email');
  return <OwnerEmailClient />;
}
