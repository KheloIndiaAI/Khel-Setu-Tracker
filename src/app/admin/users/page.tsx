import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { requirePageAccess } from '@/lib/guards';
import { creatableRoles, STANDARD_ROLES } from '@/lib/permissions';
import AdminFrame from '@/components/admin/AdminFrame';
import CreateUserForm from '@/components/admin/CreateUserForm';

// Everyday accounts (leadership, lead, teammate, SAI owner): ADMIN only.
export default async function UsersPage() {
  const user = await requirePageAccess('/admin/users');
  const accounts = await prisma.person.findMany({
    where: { role: { in: [...STANDARD_ROLES] as any } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true },
  });

  return (
    <AdminFrame
      title="Team accounts"
      intro="Create accounts for leadership, leads, teammates and SAI owners."
      userName={user.name || user.email || 'Signed in'}
      showHomeLink
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {user.role === 'ADMIN' ? (
          <CreateUserForm roles={[...creatableRoles('ADMIN')]} />
        ) : (
          <div className="bg-white rounded-2xl border border-[#DDD9CE] shadow-sm p-6 text-[15px] leading-[1.5]">
            Super admins create admin accounts on the <Link href="/admin/roles" className="text-[#A8411F] font-semibold hover:underline">Create role</Link> page. Team accounts are created by an admin.
          </div>
        )}
        <div className="bg-white rounded-2xl border border-[#DDD9CE] shadow-sm p-6 flex flex-col gap-2">
          <div className="font-extrabold text-[22px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Accounts</div>
          {accounts.length === 0 && <div className="text-[15px] text-[#5A5E63]">No accounts yet.</div>}
          {accounts.map((a) => (
            <div key={a.id} className="border-t border-[#E6E0D3] pt-2 flex justify-between text-[15px]">
              <span><strong>{a.name}</strong> <span className="text-[#5A5E63]">{a.email}</span></span>
              <span className="font-mono text-[13px] text-[#5A5E63]">{a.role}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminFrame>
  );
}
