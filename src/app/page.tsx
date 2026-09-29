import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { requirePageAccess } from '@/lib/guards';
import { homeFor, type RoleName } from '@/lib/permissions';

export default async function Sitemap() {
  const user = await requirePageAccess('/');
  const home = homeFor(user.role as RoleName);
  if (home !== '/') redirect(home); // each non-admin role lands on its own home
  // Grab a sample project ID so we can generate valid links to the dynamic pages
  const project = await prisma.item.findFirst({ where: { type: 'PROJECT' } });
  const sampleProjectId = project?.id || 'fake-id';

  return (
    <div className="w-full min-h-screen bg-[#F2EEE5] text-[#121519] font-sans p-10 flex flex-col items-center" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <div className="max-w-3xl w-full bg-white rounded-2xl p-10 shadow-lg border border-[#DDD9CE] flex flex-col gap-8">
        
        <div className="flex flex-col gap-2 border-b border-[#E6E0D3] pb-6">
          <div className="font-extrabold text-[40px] tracking-wide uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            NSDE Delivery Platform (Khel Setu)
          </div>
          <div className="text-lg text-[#5A5E63]">
            Site Directory & Role Launchpad
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Leadership & Admins */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-[22px] uppercase text-[#A8411F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Leadership & Admins</h2>
            <div className="flex flex-col gap-3">
              <Link href="/leadership" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">The Track</span>
                <span className="text-sm text-[#5A5E63]">High-level view of all projects and overall progress.</span>
              </Link>
              <Link href="/snapshot" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Daily Snapshot (Printable)</span>
                <span className="text-sm text-[#5A5E63]">Formatted for physical printing or PDF export.</span>
              </Link>
              <Link href="/import" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Excel Importer</span>
                <span className="text-sm text-[#5A5E63]">Upload and diff the weekly Excel sheet from NeGD.</span>
              </Link>
            </div>
          </div>

          {/* Project Leads */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-[22px] uppercase text-[#A8411F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Project Leads (NeGD)</h2>
            <div className="flex flex-col gap-3">
              <Link href="/lead" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Lead Desk</span>
                <span className="text-sm text-[#5A5E63]">Focused view on specific workstreams and hurdles.</span>
              </Link>
              <Link href={`/project/${sampleProjectId}`} className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Project Details</span>
                <span className="text-sm text-[#5A5E63]">Board, Timeline, Calendar, and Decisions.</span>
              </Link>
              <Link href={`/project/${sampleProjectId}/passport`} className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Project Passport</span>
                <span className="text-sm text-[#5A5E63]">Static metadata, access, environments, and readiness.</span>
              </Link>
              <Link href={`/project/${sampleProjectId}/documents`} className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Documents</span>
                <span className="text-sm text-[#5A5E63]">Version-controlled document preview module.</span>
              </Link>
            </div>
          </div>

          {/* Teammates */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-[22px] uppercase text-[#A8411F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Teammates</h2>
            <div className="flex flex-col gap-3">
              <Link href="/my-day" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">My Day (Mobile First)</span>
                <span className="text-sm text-[#5A5E63]">Daily task management, logging stuck items, and wrap-up.</span>
              </Link>
              <Link href="/privacy" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Privacy Dashboard</span>
                <span className="text-sm text-[#5A5E63]">"What others see about me" privacy controls.</span>
              </Link>
            </div>
          </div>

          {/* Project Owners */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-[22px] uppercase text-[#A8411F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Project Owners (SAI)</h2>
            <div className="flex flex-col gap-3">
              <Link href="/owner-email" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Actionable Email (Sandbox)</span>
                <span className="text-sm text-[#5A5E63]">Simulated magic link email to resolve blockers instantly.</span>
              </Link>
            </div>
          </div>

          {/* Accounts (admins only) */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-[22px] uppercase text-[#A8411F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Accounts</h2>
            <div className="flex flex-col gap-3">
              <Link href="/admin/users" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">Team accounts</span>
                <span className="text-sm text-[#5A5E63]">Create accounts for leadership, leads, teammates and SAI owners.</span>
              </Link>
              {user.role === 'SUPER_ADMIN' && (
                <Link href="/admin/roles" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                  <span className="font-bold text-[17px]">Create role</span>
                  <span className="text-sm text-[#5A5E63]">Create admin and super admin accounts.</span>
                </Link>
              )}
            </div>
          </div>

          {/* Directory & Communication */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-[22px] uppercase text-[#A8411F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Team & Communications</h2>
            <div className="flex flex-col gap-3">
              <Link href="/directory" className="p-4 rounded-xl border border-[#DDD9CE] hover:bg-[#F2EEE5] transition-colors flex flex-col gap-1">
                <span className="font-bold text-[17px]">People's Directory</span>
                <span className="text-sm text-[#5A5E63]">Profiles, resumes, and skills tracking.</span>
              </Link>
            </div>
          </div>

        </div>
        
        <div className="bg-[#121519] text-[#F2EEE5] p-5 rounded-xl text-center text-sm mt-4">
          <strong>Tip:</strong> Press <kbd className="bg-white/20 px-2 py-0.5 rounded mx-1">Cmd + K</kbd> anywhere in the app to open Global Search.
        </div>

      </div>
    </div>
  );
}
