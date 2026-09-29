import { getMissionData } from '@/lib/data';
import { calculateMissionHeadline } from '@/lib/progress';
import { requirePageAccess } from '@/lib/guards';

export default async function SnapshotPage() {
  await requirePageAccess('/snapshot');
  const data = await getMissionData();
  
  if (!data) return <div className="p-8">No data</div>;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const headline = calculateMissionHeadline({
    actual: data.missionActual,
    startDate: data.mission.startDate,
    targetDate: data.mission.targetDate
  }, today);

  const pacerPercent = Math.round(100 - headline.remaining + (headline.daysLeft * headline.neededPerDay)); 
  // actually, average pacer of all projects
  let totalPacer = 0;
  for(const p of data.projects) totalPacer += p.pacer;
  const avgPacer = Math.round(totalPacer / (data.projects.length || 1));

  const actualPercent = Math.round(data.missionActual);

  return (
    <div className="w-[1280px] h-[720px] box-border bg-[#F2EEE5] p-10 px-12 flex flex-col gap-6 font-sans text-[#121519] print:w-auto print:h-auto" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[13px] font-extrabold tracking-[2px] uppercase text-[#5A5E63]">
            National Sports Digital Ecosystem &middot; review snapshot
          </div>
          <div className="font-black text-[52px] leading-none uppercase mt-1" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Quarter 1 as of {dateStr}
          </div>
        </div>
        <div className="flex gap-7 items-end">
          <div>
            <div className="text-xs font-bold tracking-[1.4px] uppercase text-[#5A5E63]">Done</div>
            <div className="font-black text-[56px] leading-none text-[#A8321F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{actualPercent}%</div>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[1.4px] uppercase text-[#5A5E63]">Planned</div>
            <div className="font-black text-[56px] leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{avgPacer}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.55fr_1fr] gap-8 flex-grow">
        
        {/* Lanes */}
        <div className="flex flex-col rounded-xl overflow-hidden bg-white shadow-sm border border-[#E6E0D3]">
          {data.projects.map((l, i) => {
             const bg = i % 2 === 0 ? "#B5472A" : "#A8411F";
             const tok = l.actual >= 100 ? "#8FE0B8" : "#F2EEE5";
             return (
               <div key={l.id} className="grid grid-cols-[210px_1fr] h-[34px] items-stretch border-t border-[#E6E0D3] first:border-0 bg-white">
                 <span className="flex items-center gap-2 text-[13px] font-semibold pl-3">
                   <span className="font-black text-[18px] text-[#8A8E93] w-[14px]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{l.pillar?.letter || 'A'}</span>
                   <span className="truncate pr-2">{l.title}</span>
                 </span>
                 <span className="relative block" style={{ background: bg }}>
                   <span className="absolute top-[6px] w-[22px] h-[22px] rounded-full border-2 border-dashed border-[#F2EEE5] box-border block" style={{ left: `calc(${l.pacer * 0.9}% - 11px)` }}></span>
                   <span className="absolute top-[5px] w-[24px] h-[24px] rounded-full block shadow-sm" style={{ background: tok, left: `calc(${l.actual * 0.9}% - 12px)` }}></span>
                 </span>
               </div>
             )
          })}
          <div className="text-xs text-[#5A5E63] p-2 bg-[#F2EEE5]">Solid dot: actual. Dashed ring: where the plan is today.</div>
        </div>

        {/* Narrative / Chase */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="text-[18px] leading-[1.45]">
            <strong>{data.projects.filter(p => p.actual >= 100).length} projects finished</strong> and 
            <strong> {data.projects.filter(p => p.actual > p.pacer && p.actual < 100).length} ahead</strong> of plan.
          </div>
          
          <div className="text-[18px] leading-[1.45]">
            <strong>{data.projects.reduce((acc, p) => acc + p.allHurdles.filter((h: any) => h.whoClears === 'SAI_OR_PARTNER').length, 0)} items wait on SAI or partner bodies.</strong>
          </div>
          
          <div className="bg-[#121519] text-[#F2EEE5] rounded-[14px] p-5 flex flex-col gap-1.5 mt-2">
            <div className="text-xs font-extrabold tracking-[1.6px] uppercase text-[#F2B33D]">Decision needed</div>
            <div className="text-[18px] leading-[1.4] font-semibold">
              Re-plan {data.mission.name}. Reaching target needs {headline.neededPerDay.toFixed(1)}% a day against {headline.averageSoFar.toFixed(1)}% so far.
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-[#5A5E63] border-t border-[#D8D1C2] pt-2">
        <span>Generated from live project data. Numbers are not edited by hand.</span>
        <a href="/leadership" className="font-semibold hover:text-[#7E2F15]">Open the live Track</a>
      </div>

    </div>
  );
}
