import ExcelJS from 'exceljs';
import { prisma } from './prisma';
import { Status } from './progress';
import { Prisma } from '@prisma/client';

export type ParsedTask = {
  projectTitle: string;
  pillar: string;
  workstreamTitle: string;
  taskTitle: string;
  targetStartDate: Date | null;
  targetEndDate: Date | null;
  status: Status;
  parked: boolean;
  parkedReason: string | null;
  ownerName: string | null; // e.g. from Team Responsible
  remarks: string | null;
  remarksSai: string | null;
  stageGates: Array<{ name: string; done: boolean; date: Date | null }>;
  blocked: boolean;
};

export type ParsedProject = {
  title: string;
  targetDate: Date | null;
  saiInterventions: string[];
};

export type ImportResult = {
  projects: ParsedProject[];
  tasks: ParsedTask[];
  errors: string[];
};

export async function parseExcel(buffer: any): Promise<ImportResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  
  const result: ImportResult = { projects: [], tasks: [], errors: [] };
  
  // 1. Parse Quarterly Plan for deadlines and interventions
  const qp = wb.getWorksheet('NSDE Quarterly Plan');
  if (qp) {
    let currentPillar = '';
    for (let i = 5; i <= qp.rowCount; i++) {
      const row = qp.getRow(i);
      const col2 = row.getCell(2).text?.trim();
      if (!col2) continue;
      
      // If it's a pillar header row, it spans across, but text might just be in cell 2.
      if (col2.startsWith('PILLAR')) {
        continue;
      }
      
      const deadline = row.getCell(4).value as Date | string | null;
      let targetDate: Date | null = null;
      if (deadline instanceof Date) {
        targetDate = deadline;
      } else if (typeof deadline === 'string') {
        const parsed = new Date(deadline);
        if (!isNaN(parsed.getTime())) targetDate = parsed;
      }
      
      const intervention = row.getCell(7).text?.trim();
      
      const existingProj = result.projects.find(p => p.title === col2);
      if (existingProj) {
        if (targetDate && !existingProj.targetDate) existingProj.targetDate = targetDate;
        if (intervention) existingProj.saiInterventions.push(intervention);
      } else {
        result.projects.push({
          title: col2,
          targetDate,
          saiInterventions: intervention ? [intervention] : []
        });
      }
    }
  }

  // 2. Parse Micro Monthly Plan
  const mmp = wb.getWorksheet('Micro Monthly Plan');
  if (!mmp) {
    result.errors.push("Could not find 'Micro Monthly Plan' sheet.");
    return result;
  }
  
  let currentPillar = '';
  let currentProject = '';
  let currentWorkstream = '';
  
  for (let i = 4; i <= mmp.rowCount; i++) {
    const row = mmp.getRow(i);
    
    // Fill down logic
    const p = row.getCell(1).text?.trim();
    if (p) currentPillar = p;
    
    const proj = row.getCell(2).text?.trim();
    if (proj) currentProject = proj;
    
    const ws = row.getCell(4).text?.trim();
    if (ws) currentWorkstream = ws;
    
    const taskTitle = row.getCell(5).text?.trim();
    if (!taskTitle) continue; // Skip empty rows or just workstream headers
    
    const startDate = parseDate(row.getCell(6).value);
    const endDate = parseDate(row.getCell(7).value);
    
    const ownerNameRaw = row.getCell(12).text?.trim() || row.getCell(11).text?.trim();
    // Strip roles in brackets, e.g. "Narendra (Backend)" -> "Narendra"
    const ownerName = ownerNameRaw ? ownerNameRaw.split(',')[0].replace(/\\(.*\\)/, '').trim() : null;
    
    const rawStatus = row.getCell(18).text?.trim();
    const remarks = row.getCell(19).text?.trim() || null;
    const remarksSai = row.getCell(20).text?.trim() || null;
    
    let status = Status.TO_DO;
    let parked = false;
    let blocked = false;
    let parkedReason: string | null = null;
    
    if (rawStatus === 'Completed') status = Status.LIVE;
    else if (rawStatus === 'In Progress') status = Status.DOING;
    else if (rawStatus === 'Yet to Start' || !rawStatus) status = Status.TO_DO;
    else if (rawStatus === 'Blocked') {
      status = Status.DOING;
      blocked = true;
    } else if (rawStatus === 'Parked') {
      status = Status.TO_DO;
      parked = true;
      parkedReason = remarks;
    }
    
    // Parse stage gates
    const stageGates = [];
    const gateCols = [
      { name: 'BRD', col: 13 },
      { name: 'Design', col: 14 },
      { name: 'Development', col: 15 },
      { name: 'Deployment', col: 16 },
      { name: 'QA', col: 17 }
    ];
    
    for (const g of gateCols) {
      const val = row.getCell(g.col).text?.trim();
      if (val && val.toLowerCase() === 'yes' || val.toLowerCase() === 'done') {
        stageGates.push({ name: g.name, done: true, date: null });
      } else if (val) {
        // Any free text goes to activity history, but we'll just store it here for now
      }
    }
    
    result.tasks.push({
      projectTitle: currentProject,
      pillar: currentPillar,
      workstreamTitle: currentWorkstream,
      taskTitle,
      targetStartDate: startDate,
      targetEndDate: endDate,
      status,
      parked,
      blocked,
      parkedReason,
      ownerName,
      remarks,
      remarksSai,
      stageGates,
    });
  }
  
  return result;
}

function parseDate(val: any): Date | null {
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}
