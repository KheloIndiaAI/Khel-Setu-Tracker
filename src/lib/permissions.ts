/**
 * Single source of truth for who may do what.
 * Pure module (no DB, no Next imports) so proxy.ts, guards.ts and tests can share it.
 */
export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'LEADERSHIP', 'LEAD', 'TEAMMATE', 'OWNER'] as const;
export type RoleName = (typeof ROLES)[number];

/** Accounts that only a SUPER_ADMIN may create (the "create role" page). */
export const PRIVILEGED_ROLES: readonly RoleName[] = ['SUPER_ADMIN', 'ADMIN'];

/** Everyday accounts, created by ADMIN. */
export const STANDARD_ROLES: readonly RoleName[] = ROLES.filter((r) => !PRIVILEGED_ROLES.includes(r));

export function isRole(value: unknown): value is RoleName {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Roles an actor is allowed to create. SUPER_ADMIN: ADMIN/SUPER_ADMIN only. ADMIN: everything else. */
export function creatableRoles(actorRole: string | null | undefined): readonly RoleName[] {
  if (actorRole === 'SUPER_ADMIN') return PRIVILEGED_ROLES;
  if (actorRole === 'ADMIN') return STANDARD_ROLES;
  return [];
}

export function canCreateRole(actorRole: string | null | undefined, target: unknown): target is RoleName {
  return isRole(target) && creatableRoles(actorRole).includes(target);
}

// ---------------------------------------------------------------------------
// Route access. Every path requires sign-in; the rules below narrow it by role.
// SUPER_ADMIN and ADMIN reach every page, except that /admin/roles is SUPER_ADMIN only.
// ---------------------------------------------------------------------------
const ADMINS: readonly RoleName[] = ['SUPER_ADMIN', 'ADMIN'];
const PLANNERS: readonly RoleName[] = [...ADMINS, 'LEAD'];
const TRACK_VIEWERS: readonly RoleName[] = [...ADMINS, 'LEADERSHIP', 'LEAD'];

type Rule = { prefix: string; roles: readonly RoleName[] };

const RULES: readonly Rule[] = [
  { prefix: '/admin/roles', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin', roles: ADMINS },
  { prefix: '/api/users', roles: ADMINS },
  { prefix: '/api/cron', roles: ADMINS }, // route also accepts the CRON_SECRET bearer token
  { prefix: '/api/import', roles: PLANNERS },
  { prefix: '/api/items', roles: PLANNERS },
  { prefix: '/import', roles: PLANNERS },
  { prefix: '/leadership', roles: TRACK_VIEWERS },
  { prefix: '/snapshot', roles: TRACK_VIEWERS },
  { prefix: '/lead', roles: TRACK_VIEWERS },
  { prefix: '/owner-email', roles: [...ADMINS, 'OWNER'] },
];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

/** Roles allowed on a path. Anything not listed is open to every signed-in role. */
export function allowedRolesFor(pathname: string): readonly RoleName[] {
  const rule = [...RULES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((r) => matches(pathname, r.prefix));
  return rule ? rule.roles : ROLES;
}

export function canAccess(role: unknown, pathname: string): boolean {
  return isRole(role) && allowedRolesFor(pathname).includes(role);
}

/** Where each role lands. Every value must be allowed for that role (checked in tests). */
export function homeFor(role: RoleName): string {
  switch (role) {
    case 'LEADERSHIP': return '/leadership';
    case 'LEAD': return '/lead';
    case 'TEAMMATE': return '/my-day';
    case 'OWNER': return '/owner-email';
    default: return '/';
  }
}

/** Paths that need no session. /api/cron does its own check (session or CRON_SECRET). */
export function isPublicPath(pathname: string): boolean {
  return matches(pathname, '/login') || matches(pathname, '/api/auth');
}
export function isSelfGuardedPath(pathname: string): boolean {
  return matches(pathname, '/api/cron');
}
