import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { Prisma, type Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiAccess } from '@/lib/guards';
import { canCreateRole } from '@/lib/permissions';

// Both admin tiers may call this; which roles each may create is decided by canCreateRole.
export async function POST(req: NextRequest) {
  const guard = await requireApiAccess('/api/users');
  if ('error' in guard) return guard.error;
  const actor = guard.user;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const loginId = typeof body.loginId === 'string' ? body.loginId.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = body.role;

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'Name must be 2 to 100 characters.' }, { status: 400 });
  }
  if (loginId.length < 3 || loginId.length > 100 || /\s/.test(loginId)) {
    return NextResponse.json({ error: 'Login ID must be 3 to 100 characters with no spaces.' }, { status: 400 });
  }
  if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return NextResponse.json({ error: 'Password needs at least 10 characters, with letters and digits.' }, { status: 400 });
  }
  if (!canCreateRole(actor.role, role)) {
    return NextResponse.json({ error: 'You are not allowed to create this role.' }, { status: 403 });
  }

  const passwordHash = await hash(password, 10);

  try {
    const person = await prisma.$transaction(async (tx) => {
      const created = await tx.person.create({
        data: { email: loginId, name, role: role as Role, passwordHash },
        select: { id: true, email: true, name: true, role: true },
      });
      await tx.activityLog.create({
        data: {
          who: actor.name || actor.email || actor.id,
          what: `Created ${created.role} account "${created.email}"`,
          after: created,
        },
      });
      return created;
    });
    return NextResponse.json({ success: true, person }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'That login ID is already in use.' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Could not create the account.' }, { status: 500 });
  }
}
