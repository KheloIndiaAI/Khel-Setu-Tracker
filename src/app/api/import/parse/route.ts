import { NextRequest, NextResponse } from 'next/server';
import { parseExcel } from '@/lib/excel-import';
import { prisma } from '@/lib/prisma';
import { requireApiAccess } from '@/lib/guards';

export async function POST(request: NextRequest) {
  const guard = await requireApiAccess('/api/import');
  if ('error' in guard) return guard.error;

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const parsedData = await parseExcel(buffer);
    
    // Compare with DB to find new items and conflicts
    const allDbTasks = await prisma.item.findMany({
      where: { type: 'TASK' },
      include: {
        parent: {
          include: {
            parent: true // Workstream -> Project
          }
        }
      }
    });

    const newTasks = [];
    const conflicts = [];

    for (const pTask of parsedData.tasks) {
      // Find matching task in DB
      const dbTask = allDbTasks.find(t => 
        t.title === pTask.taskTitle &&
        t.parent?.title === pTask.workstreamTitle &&
        t.parent?.parent?.title === pTask.projectTitle
      );

      if (!dbTask) {
        newTasks.push(pTask);
      } else {
        // Compare fields
        const differences = [];
        
        if (dbTask.status !== pTask.status) {
          differences.push({ field: 'status', app: dbTask.status, excel: pTask.status });
        }
        
        const appStart = dbTask.targetStartDate ? new Date(dbTask.targetStartDate).toISOString().split('T')[0] : null;
        const exStart = pTask.targetStartDate ? pTask.targetStartDate.toISOString().split('T')[0] : null;
        if (appStart !== exStart) {
          differences.push({ field: 'targetStartDate', app: appStart, excel: exStart });
        }
        
        const appEnd = dbTask.targetEndDate ? new Date(dbTask.targetEndDate).toISOString().split('T')[0] : null;
        const exEnd = pTask.targetEndDate ? pTask.targetEndDate.toISOString().split('T')[0] : null;
        if (appEnd !== exEnd) {
          differences.push({ field: 'targetEndDate', app: appEnd, excel: exEnd });
        }

        if (dbTask.ownerName !== pTask.ownerName) {
          differences.push({ field: 'ownerName', app: dbTask.ownerName, excel: pTask.ownerName });
        }
        
        if (differences.length > 0) {
          conflicts.push({
            dbId: dbTask.id,
            projectTitle: pTask.projectTitle,
            workstreamTitle: pTask.workstreamTitle,
            taskTitle: pTask.taskTitle,
            differences,
            excelData: pTask
          });
        }
      }
    }

    return NextResponse.json({
      parsedData,
      newTasks,
      conflicts
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
