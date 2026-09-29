import { requirePageAccess } from '@/lib/guards';

// /import/page.tsx is a client component, so the server-side check lives here (the proxy checks too).
export default async function ImportLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess('/import');
  return <>{children}</>;
}
