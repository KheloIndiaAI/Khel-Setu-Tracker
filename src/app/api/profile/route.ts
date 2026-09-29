import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAccess } from '@/lib/guards';

export async function POST(req: NextRequest) {
  const guard = await requireApiAccess('/api/profile');
  if ('error' in guard) return guard.error;
  const user = guard.user;

  try {
    const body = await req.json();
    const { 
      id, name, team,
      experience, skills, education, qualifications, resumeUrl,
      birthday, birthdayVis, interests, interestsVis, workAnniv, workAnnivVis 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    // People edit their own profile; only admins may edit someone else's.
    if (id !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const updated = await prisma.person.update({
      where: { id },
      data: {
        name,
        team,
        experience,
        skills,
        education,
        qualifications,
        resumeUrl,
        birthday: birthday ? new Date(birthday) : null,
        birthdayVis: !!birthdayVis,
        interests,
        interestsVis: !!interestsVis,
        workAnniv: workAnniv ? new Date(workAnniv) : null,
        workAnnivVis: !!workAnnivVis
      }
    });

    return NextResponse.json({ success: true, person: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
