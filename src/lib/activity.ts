import { prisma } from './prisma';

export async function withActivityLog<T>(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  action: () => Promise<T>,
  logData: {
    who: string;
    what: string;
    itemId?: string;
    before?: any;
    after?: any;
  }
): Promise<T> {
  const result = await action();
  
  await tx.activityLog.create({
    data: {
      who: logData.who,
      what: logData.what,
      itemId: logData.itemId,
      before: logData.before || null,
      after: logData.after || null,
    }
  });
  
  return result;
}
