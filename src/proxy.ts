import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { allowedRolesFor, homeFor, isPublicPath, isRole, isSelfGuardedPath } from '@/lib/permissions';

// First gate on every request: signed in? allowed for this path? Pages and route handlers
// re-check with guards.ts (the proxy is an optimistic check, not the only line of defence).
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname) || isSelfGuardedPath(pathname)) return NextResponse.next();

  const isApi = pathname.startsWith('/api/');
  const secure = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  const cookieName = `${secure ? '__Secure-' : ''}authjs.session-token`;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: secure,
    salt: cookieName,
  });
  const role = token?.role;

  if (!isRole(role)) {
    if (isApi) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(url);
  }

  if (!allowedRolesFor(pathname).includes(role)) {
    if (isApi) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
