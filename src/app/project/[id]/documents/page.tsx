import { requirePageAccess } from '@/lib/guards';
import Link from 'next/link';

export default async function DocumentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAccess('/project');
  const { id } = await params;
  
  // Mock data for the version control fake
  const versions = [
    { v: 'v3', date: '21 Sep, 10:42 am', by: 'Mansi', note: 'Added SLA requirements for WhatsApp vendor' },
    { v: 'v2', date: '18 Sep, 4:15 pm', by: 'Gaurav', note: 'Fixed formatting in section 4' },
    { v: 'v1', date: '12 Sep, 9:00 am', by: 'Mansi', note: 'Initial draft for review' },
  ];

  return (
    <div className="w-full min-h-[100vh] bg-[#F2EEE5] text-[#121519] font-sans flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-12 bg-[#121519] text-[#F2EEE5]">
        <div className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#B5472A" strokeWidth="3">
            <path d="M4 12h18a8 8 0 0 1 0 16H4"></path>
            <path d="M4 6h18a14 14 0 0 1 0 28"></path>
          </svg>
          <div className="font-extrabold text-[26px] tracking-wide uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            NSDE Delivery
          </div>
        </div>
        <Link href={`/project/${id}/passport`} className="text-[#F2B33D] text-sm font-semibold hover:text-[#FFD27A] px-2 py-1">
          &larr; Back to Passport
        </Link>
      </div>

      <div className="flex flex-grow h-[calc(100vh-66px)]">
        
        {/* Document Fake Preview */}
        <div className="flex-grow bg-[#E6E0D3] p-12 flex justify-center items-start overflow-y-auto">
          <div className="bg-white w-[800px] h-[1131px] shadow-sm border border-[#DDD9CE] p-16 flex flex-col gap-6">
            <div className="text-3xl font-bold mb-4">Business Requirements Document (BRD)</div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5 mb-8"></div>
            
            <div className="text-xl font-bold mt-8 mb-4">1. Scope</div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>

            <div className="text-xl font-bold mt-8 mb-4">2. Functional Requirements</div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>

        {/* Version Control Sidebar */}
        <div className="w-[400px] bg-white border-l border-[#DDD9CE] flex flex-col">
          <div className="p-6 border-b border-[#DDD9CE]">
            <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Version History</div>
            <div className="text-sm text-[#5C645F] mt-1">Files are stored centrally. No emailing documents back and forth.</div>
            <button className="w-full mt-4 min-h-[44px] rounded-lg bg-[#121519] text-[#F2EEE5] font-semibold text-[14px]">
              Upload new version
            </button>
          </div>
          
          <div className="flex flex-col flex-grow overflow-y-auto">
            {versions.map((v, i) => (
              <div key={v.v} className={`p-6 border-b border-[#EFECE3] flex flex-col gap-2 ${i === 0 ? 'bg-[#F9F7F1]' : ''}`}>
                <div className="flex justify-between items-baseline">
                  <span className="font-mono font-bold text-base">{v.v}</span>
                  <span className="text-xs font-semibold text-[#5C645F]">{v.date}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{v.by}</span> &middot; {v.note}
                </div>
                {i === 0 && (
                  <div className="mt-2 text-xs font-bold text-[#1F6B4A] uppercase tracking-wide">
                    Current version
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
