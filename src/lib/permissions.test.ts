import { describe, it, expect } from 'vitest';
import {
  ROLES, STANDARD_ROLES, canCreateRole, creatableRoles, allowedRolesFor, canAccess, homeFor, isPublicPath,
} from './permissions';

const SAMPLE_PATHS = [
  '/', '/leadership', '/lead', '/snapshot', '/import', '/my-day', '/privacy', '/owner-email', '/directory',
  '/project/abc', '/project/abc/passport', '/project/abc/documents', '/admin/users',
  '/api/items', '/api/profile', '/api/search', '/api/import/parse', '/api/import/apply', '/api/users', '/api/cron/snapshot',
];

describe('account creation rules', () => {
  it('super admin can create only admin and super admin', () => {
    expect([...creatableRoles('SUPER_ADMIN')].sort()).toEqual(['ADMIN', 'SUPER_ADMIN']);
    for (const r of STANDARD_ROLES) expect(canCreateRole('SUPER_ADMIN', r)).toBe(false);
  });
  it('admin cannot create admin or super admin', () => {
    expect(canCreateRole('ADMIN', 'ADMIN')).toBe(false);
    expect(canCreateRole('ADMIN', 'SUPER_ADMIN')).toBe(false);
    for (const r of STANDARD_ROLES) expect(canCreateRole('ADMIN', r)).toBe(true);
  });
  it('nobody else can create accounts, and junk roles are rejected', () => {
    for (const a of ['LEADERSHIP', 'LEAD', 'TEAMMATE', 'OWNER', undefined, null, '']) {
      expect(creatableRoles(a as any)).toEqual([]);
    }
    expect(canCreateRole('SUPER_ADMIN', 'ROOT')).toBe(false);
  });
});

describe('route access', () => {
  it('super admin reaches every page and API', () => {
    for (const p of [...SAMPLE_PATHS, '/admin/roles']) expect(canAccess('SUPER_ADMIN', p)).toBe(true);
  });
  it('admin reaches everything except the create-role page', () => {
    for (const p of SAMPLE_PATHS) expect(canAccess('ADMIN', p)).toBe(true);
    expect(canAccess('ADMIN', '/admin/roles')).toBe(false);
    expect(allowedRolesFor('/admin/roles')).toEqual(['SUPER_ADMIN']);
  });
  it('only privileged roles reach /admin', () => {
    for (const r of ['LEADERSHIP', 'LEAD', 'TEAMMATE', 'OWNER']) {
      expect(canAccess(r, '/admin/users')).toBe(false);
      expect(canAccess(r, '/api/users')).toBe(false);
    }
  });
  it('teammates never reach the Track, snapshot, import or planning API', () => {
    for (const p of ['/leadership', '/lead', '/snapshot', '/import', '/api/items', '/api/import/apply']) {
      expect(canAccess('TEAMMATE', p)).toBe(false);
    }
    expect(canAccess('TEAMMATE', '/my-day')).toBe(true);
  });
  it('prefix matching respects path boundaries', () => {
    expect(allowedRolesFor('/lead')).toContain('LEAD');
    expect(canAccess('LEAD', '/leadership')).toBe(true);
    expect(canAccess('LEADERSHIP', '/lead')).toBe(true);
    expect(canAccess('OWNER', '/leadership')).toBe(false);
    expect(canAccess('TEAMMATE', '/leadership-notes')).toBe(true); // not the /leadership rule
    expect(canAccess('ADMIN', '/admin/roles-x')).toBe(true); // /admin rule, not /admin/roles
    expect(canAccess('OWNER', '/api/users-export')).toBe(true); // not the /api/users rule
  });
  it('rejects unknown roles', () => {
    expect(canAccess(undefined, '/')).toBe(false);
    expect(canAccess('ROOT', '/')).toBe(false);
  });
  it("each role's home is a page that role may open", () => {
    for (const r of ROLES) expect(canAccess(r, homeFor(r))).toBe(true);
  });
  it('only sign-in paths are public', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/api/auth/session')).toBe(true);
    expect(isPublicPath('/')).toBe(false);
    expect(isPublicPath('/loginx')).toBe(false);
  });
});
