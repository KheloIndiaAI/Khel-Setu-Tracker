import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { allowedRolesFor, homeFor, isRole } from '@/lib/permissions';

/** Pages: sign-in required; sends a signed-in user without access to their own home. */
export async function requirePageAccess(path: string) {
  const session = await auth();
  const user = session?.user;
  if (!user || !isRole(user.role)) redirect('/login');
  if (!allowedRolesFor(path).includes(user.role)) redirect(homeFor(user.role));
  return user;
}

/** Route handlers: returns the user, or a ready-made 401/403 response. */
export async function requireApiAccess(path: string) {
  const session = await auth();
  const user = session?.user;
  if (!user || !isRole(user.role)) {
    return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) } as const;
  }
  if (!allowedRolesFor(path).includes(user.role)) {
    return { error: NextResponse.json({ error: 'Not allowed' }, { status: 403 }) } as const;
  }
  return { user } as const;
}
