import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

// The only seeded account. It can create ADMIN / SUPER_ADMIN accounts and nothing else.
// The login ID is stored in Person.email (free-form). Change this password after first sign-in.
const SUPER_ADMIN_LOGIN = 'OSD@26'
const SUPER_ADMIN_PASSWORD = 'OSD_26'

// Old demo accounts from the first seed; removed if nothing references them.
const LEGACY_DEMO_LOGINS = ['admin@khelsetu.in', 'leader@khelsetu.in', 'lead@khelsetu.in']

async function main() {
  console.log('Seeding database...')

  for (const email of LEGACY_DEMO_LOGINS) {
    try {
      const { count } = await prisma.person.deleteMany({ where: { email } })
      if (count > 0) console.log(`Removed legacy demo user: ${email}`)
    } catch {
      console.warn(`Could not remove ${email} (still referenced by other records); leaving it in place.`)
    }
  }

  const superAdmin = await prisma.person.upsert({
    where: { email: SUPER_ADMIN_LOGIN },
    update: { role: Role.SUPER_ADMIN },
    create: {
      email: SUPER_ADMIN_LOGIN,
      name: 'OSD Super Admin',
      passwordHash: await hash(SUPER_ADMIN_PASSWORD, 10),
      role: Role.SUPER_ADMIN,
    },
  })
  console.log(`Super admin ready: ${superAdmin.email}`)

  const missionName = 'Q1 Mission'
  const existingMission = await prisma.mission.findFirst({ where: { name: missionName } })
  if (!existingMission) {
    await prisma.mission.create({
      data: {
        name: missionName,
        startDate: new Date('2026-07-01T00:00:00Z'),
        targetDate: new Date('2026-09-30T00:00:00Z'),
        originalTargetDate: new Date('2026-09-30T00:00:00Z'),
      },
    })
    console.log(`Created mission: ${missionName}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
