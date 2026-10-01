import { requirePageAccess } from '@/lib/guards';
import { getProject } from '@/lib/data';
import Link from 'next/link';

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAccess('/project');
  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) return <div>Project not found</div>;

  return (
    <div className="w-full min-h-[100vh] bg-[#F2EEE5] text-[#121519] font-sans flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-7 py-4 px-12 bg-[#121519] text-[#F2EEE5]">
        <div className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#B5472A" strokeWidth="3">
            <path d="M4 12h18a8 8 0 0 1 0 16H4"></path>
            <path d="M4 6h18a14 14 0 0 1 0 28"></path>
          </svg>
          <div className="font-extrabold text-[26px] tracking-wide uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            NSDE Delivery
          </div>
        </div>
        <div className="text-sm text-[#B9B5AC] flex-grow">
          {project.title} &middot; Project Passport
        </div>
        <Link href="/leadership" className="text-[#F2B33D] text-sm font-semibold px-1 hover:text-[#FFD27A]">Back to the Track</Link>
        <Link href="/lead" className="text-[#F2B33D] text-sm font-semibold px-1 hover:text-[#FFD27A]">Lead desk</Link>
      </div>

      <div className="pt-8 px-12 flex flex-col gap-6">
        
        {/* Title / Info block */}
        <div className="flex gap-7 items-stretch">
          <div className="w-[200px] rounded-[14px] bg-[#B5472A] text-white p-5 box-border flex flex-col justify-between">
            <div className="text-xs font-semibold tracking-[1.4px] uppercase">Project Passport</div>
            <div className="font-mono text-[40px] font-semibold">{project.pillar?.letter}&middot;01</div>
          </div>
          <div className="flex-grow flex flex-col gap-2 justify-center">
            <div className="font-black text-[48px] uppercase leading-[1.1]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {project.title}
            </div>
            <div className="text-base leading-[1.5] text-[#3A413D] max-w-[820px]">
              The core platform module of the National Sports Digital Ecosystem. Manages workflows, entities, and deliverables assigned to {project.ownerName || 'the primary team'}.
            </div>
            <div className="text-[15px] pt-1">
              <Link href={`/project/${project.id}`} className="text-[#A8411F] font-semibold hover:underline">Back to the project page</Link>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-5 pb-12">
          
          <div className="bg-white border border-[#DDD9CE] rounded-[14px] p-5 flex flex-col gap-2.5">
            <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Identity</div>
            <div className="text-[15px] leading-[1.6]">
              <span className="text-[#5C645F]">Pillar</span> &middot; {project.pillar?.letter}{project.pillar?.name ? `, ${project.pillar.name}` : ''}<br/>
              <span className="text-[#5C645F]">Owner at SAI</span> &middot; [officer, IT Division]<br/>
              <span className="text-[#5C645F]">Lead at NeGD</span> &middot; {project.ownerName || 'Mansi'} (BA)<br/>
              <span className="text-[#5C645F]">Target date</span> &middot; {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString('en-GB') : '30 Sep 2026'}
            </div>
          </div>

          <div className="bg-white border border-[#DDD9CE] rounded-[14px] p-5 flex flex-col gap-2.5">
            <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Requirements</div>
            <div className="text-[15px] leading-[1.6]">
              <Link href={`/project/${project.id}/documents`} className="text-[#A8411F] font-semibold hover:underline">[BRD file, PDF]</Link> <span className="px-2 py-0.5 rounded-[5px] bg-[#E3F0E9] text-[#134B33] text-xs font-semibold ml-1">Approved</span><br/>
              <Link href={`/project/${project.id}/documents`} className="text-[#A8411F] font-semibold hover:underline">[FRD and user stories]</Link> <span className="text-[#5C645F] ml-1">version [n]</span><br/>
              <Link href={`/project/${project.id}/documents`} className="text-[#A8411F] font-semibold hover:underline">Approach note</Link> <span className="text-[#5C645F] ml-1">15 Aug</span>
            </div>
          </div>

          <div className="bg-white border border-[#DDD9CE] rounded-[14px] p-5 flex flex-col gap-2.5">
            <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Design</div>
            <div className="text-[15px] leading-[1.6]">
              <span className="text-[#A8411F] font-semibold cursor-pointer">[Login and home page designs]</span> <span className="text-[#5C645F]">Tiyasha, Harsha</span><br/>
              <span className="text-[#A8411F] font-semibold cursor-pointer">[Admin dashboard design]</span> <span className="text-[#5C645F]">Rameshwar</span><br/>
              <span className="text-[#A8411F] font-semibold cursor-pointer">[Architecture diagram]</span>
            </div>
          </div>

          <div className="bg-white border border-[#DDD9CE] rounded-[14px] p-5 flex flex-col gap-2.5">
            <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Environments</div>
            <div className="text-[15px] leading-[1.6]">
              <span className="text-[#5C645F]">Production</span> &middot; [URL]<br/>
              <span className="text-[#5C645F]">UAT</span> &middot; [URL]<br/>
              <span className="text-[#5C645F]">Staging</span> &middot; [URL]<br/>
              <span className="text-[#5C645F]">Hosting</span> &middot; [cloud and account]<br/>
              <span className="text-[#5C645F]">Code</span> &middot; [repository link]
            </div>
          </div>

          <div className="bg-white border border-[#DDD9CE] rounded-[14px] p-5 flex flex-col gap-2.5">
            <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Access</div>
            <div className="text-[15px] leading-[1.6]">Logins and keys for this project live in the vault, never here.</div>
            <button className="min-h-[46px] rounded-lg bg-[#121519] text-[#F2EEE5] font-semibold text-[15px] flex items-center justify-center gap-2 mt-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2EEE5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2"></rect>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
              </svg>
              Open this project's vault collection
            </button>
            <div className="text-[13px] text-[#5C645F] mt-1">Every view of a password is logged.</div>
          </div>

          <div className="bg-white border border-[#DDD9CE] rounded-[14px] p-5 flex flex-col gap-2.5">
            <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Readiness</div>
            <div className="text-[15px] leading-[1.7]">
              <span className="font-semibold text-[#8A4F0A]">In progress</span> &middot; Security audit<br/>
              <span className="font-semibold text-[#8A4F0A]">In progress</span> &middot; CDAC AUA onboarding<br/>
              <span className="font-semibold text-[#3A413D]">Not started</span> &middot; UAT sign-off by the owner<br/>
              <span className="font-semibold text-[#3A413D]">Not started</span> &middot; Go-live checklist
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
