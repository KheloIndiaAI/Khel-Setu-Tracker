import { parseExcel } from '../lib/excel-import';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run import:excel -- <file.xlsx>");
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  console.log(`Reading ${absolutePath}...`);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(absolutePath);
  const parsed = await parseExcel(buffer);
  
  console.log(`Found ${parsed.tasks.length} tasks in Excel.`);

  // Find conflicts and new items
  const allDbTasks = await prisma.item.findMany({
    where: { type: 'TASK' },
    include: {
      parent: {
        include: {
          parent: true
        }
      }
    }
  });

  const newTasks = [];
  const conflicts = [];
  
  let noStatusCount = 0;
  let noDatesCount = 0;
  let noPersonCount = 0;

  for (const pTask of parsed.tasks) {
    if (pTask.status === 'TO_DO' && !pTask.targetStartDate) noStatusCount++; // Rough heuristic based on rules
    if (!pTask.targetStartDate || !pTask.targetEndDate) noDatesCount++;
    if (!pTask.ownerName) noPersonCount++;

    const dbTask = allDbTasks.find(t => 
      t.title === pTask.taskTitle &&
      t.parent?.title === pTask.workstreamTitle &&
      t.parent?.parent?.title === pTask.projectTitle
    );

    if (!dbTask) {
      newTasks.push(pTask);
    } else {
      let differs = false;
      if (dbTask.status !== pTask.status) differs = true;
      
      const appStart = dbTask.targetStartDate ? new Date(dbTask.targetStartDate).toISOString().split('T')[0] : null;
      const exStart = pTask.targetStartDate ? pTask.targetStartDate.toISOString().split('T')[0] : null;
      if (appStart !== exStart) differs = true;
      
      if (differs) {
        conflicts.push(pTask);
      }
    }
  }

  console.log('--- Import Report ---');
  console.log(`Rows with no status: ~${noStatusCount}`);
  console.log(`Rows with no dates: ${noDatesCount}`);
  console.log(`Rows with no person: ${noPersonCount}`);
  console.log(`New Tasks to create: ${newTasks.length}`);
  console.log(`Conflicts to resolve (skipped in CLI): ${conflicts.length}`);

  // Auto-apply new tasks only in CLI (conflicts require UI)
  if (newTasks.length > 0) {
    console.log("Creating new tasks...");
    for (const pTask of newTasks) {
      let pillar = await prisma.pillar.findFirst({ where: { letter: pTask.pillar || 'A' } });
      if (!pillar) pillar = await prisma.pillar.create({ data: { letter: pTask.pillar || 'A', name: `Pillar ${pTask.pillar || 'A'}` } });

      let project = await prisma.item.findFirst({ where: { type: 'PROJECT', title: pTask.projectTitle } });
      if (!project) project = await prisma.item.create({ data: { title: pTask.projectTitle, type: 'PROJECT', pillarId: pillar.id } });

      let workstream = await prisma.item.findFirst({ where: { type: 'WORKSTREAM', title: pTask.workstreamTitle, parentId: project.id } });
      if (!workstream) workstream = await prisma.item.create({ data: { title: pTask.workstreamTitle, type: 'WORKSTREAM', parentId: project.id } });

      const task = await prisma.item.create({
        data: {
          title: pTask.taskTitle,
          type: 'TASK',
          parentId: workstream.id,
          status: pTask.status,
          targetStartDate: pTask.targetStartDate,
          targetEndDate: pTask.targetEndDate,
          ownerName: pTask.ownerName,
          parked: pTask.parked,
          parkedReason: pTask.parkedReason,
        }
      });

      await prisma.activityLog.create({
        data: {
          who: 'CLI Import',
          what: 'Created from Excel Import',
          itemId: task.id,
          after: pTask as any
        }
      });
    }
    console.log("Done.");
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
