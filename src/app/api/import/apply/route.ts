import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAccess } from '@/lib/guards';
import { ParsedTask } from '@/lib/excel-import';

export async function POST(request: NextRequest) {
  const guard = await requireApiAccess('/api/import');
  if ('error' in guard) return guard.error;
  const session = { user: guard.user };

  const body = await request.json();
  const { newTasks, resolvedConflicts, fileName } = body;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Insert new tasks
      for (const pTask of newTasks as ParsedTask[]) {
        // Ensure Project exists
        let project = await tx.item.findFirst({
          where: { type: 'PROJECT', title: pTask.projectTitle }
        });
        if (!project) {
          // ensure pillar exists
          let pillar = await tx.pillar.findFirst({ where: { letter: pTask.pillar || 'A' } });
          if (!pillar) {
             pillar = await tx.pillar.create({
               data: { letter: pTask.pillar || 'A', name: `Pillar ${pTask.pillar || 'A'}` }
             });
          }
          project = await tx.item.create({
            data: {
              title: pTask.projectTitle,
              type: 'PROJECT',
              pillarId: pillar.id
            }
          });
        }

        // Ensure Workstream exists
        let workstream = await tx.item.findFirst({
          where: { type: 'WORKSTREAM', title: pTask.workstreamTitle, parentId: project.id }
        });
        if (!workstream) {
          workstream = await tx.item.create({
            data: {
              title: pTask.workstreamTitle,
              type: 'WORKSTREAM',
              parentId: project.id
            }
          });
        }

        // Create Task
        const task = await tx.item.create({
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
        
        // Add hurdles if blocked
        if (pTask.blocked) {
           await tx.hurdle.create({
             data: {
               itemId: task.id,
               text: "Blocked (Imported from Excel)",
               whoClears: "UNOWNED",
               ownerNameBody: "Import"
             }
           });
        }

        // Add ActivityLog
        await tx.activityLog.create({
          data: {
            who: session?.user?.name || session?.user?.email || 'Unknown',
            what: `Created from Excel Import (${fileName || 'unknown'})`,
            itemId: task.id,
            after: pTask as any
          }
        });
      }

      // 2. Apply resolved conflicts
      for (const conf of resolvedConflicts) {
        const { dbId, excelData, selectedFields } = conf; // selectedFields: ['status', 'targetStartDate']
        
        const dataToUpdate: any = {};
        for (const field of selectedFields) {
           dataToUpdate[field] = excelData[field];
        }

        if (Object.keys(dataToUpdate).length > 0) {
          const oldTask = await tx.item.findUnique({ where: { id: dbId } });
          const updated = await tx.item.update({
            where: { id: dbId },
            data: dataToUpdate
          });
          
          await tx.activityLog.create({
            data: {
              who: session?.user?.name || session?.user?.email || 'Unknown',
              what: `Updated from Excel Import (${fileName || 'unknown'})`,
              itemId: dbId,
              before: Object.keys(dataToUpdate).reduce((acc: any, key) => { acc[key] = (oldTask as any)[key]; return acc; }, {}),
              after: dataToUpdate
            }
          });
        }
      }
    }, { timeout: 20000 }); // Increase timeout for bulk operations

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
