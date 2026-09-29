import { prisma } from '@/lib/prisma';
import { requirePageAccess } from '@/lib/guards';
import { creatableRoles, PRIVILEGED_ROLES } from '@/lib/permissions';
import AdminFrame from '@/components/admin/AdminFrame';
import CreateUserForm from '@/components/admin/CreateUserForm';

// Create-role page: SUPER_ADMIN only. Creates ADMIN / SUPER_ADMIN accounts.
export default async function CreateRolePage() {
  const user = await requirePageAccess('/admin/roles');
  const accounts = await prisma.person.findMany({
    where: { role: { in: [...PRIVILEGED_ROLES] as any } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true },
  });

  return (
    <AdminFrame
      title="Create role"
      intro="Create admin and super admin accounts. Everyday accounts are created by an admin."
      userName={user.name || user.email || 'Signed in'}
      showHomeLink
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <CreateUserForm roles={[...creatableRoles('SUPER_ADMIN')]} />
        <div className="bg-white rounded-2xl border border-[#DDD9CE] shadow-sm p-6 flex flex-col gap-2">
          <div className="font-extrabold text-[22px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Existing admin accounts</div>
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
