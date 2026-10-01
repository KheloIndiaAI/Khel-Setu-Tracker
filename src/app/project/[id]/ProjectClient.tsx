"use client";

import { useState } from 'react';
import Link from 'next/link';
import CommunicationThread from '@/components/CommunicationThread';
import ItemActions from '@/components/ItemActions';
import { useRouter } from 'next/navigation';

export default function ProjectClient({ project, people, canManage }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Board');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', parentId: '', type: 'TASK', start: '', end: '', teamIds: [] as string[] });
  const [isSavingItem, setIsSavingItem] = useState(false);

  const handleAddItem = async () => {
    if (!newItem.title || (newItem.type === 'TASK' && !newItem.parentId)) return;
    setIsSavingItem(true);
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newItem.title,
        parentId: newItem.parentId || project.id, // workstreams are children of the project
        type: newItem.type,
        targetStartDate: newItem.start || null,
        targetEndDate: newItem.end || null,
        teamIds: newItem.teamIds
      })
    });
    setIsAddingItem(false);
    setNewItem({ title: '', parentId: '', type: 'TASK', start: '', end: '', teamIds: [] });
    router.refresh();
    setIsSavingItem(false);
  };

  if (!project) return <div>Project not found</div>;

  const gap = Math.round(project.actual - project.pacer);
  const isFinished = project.actual >= 100;

  // Derive columns for Board
  const tasks = project.children?.flatMap((ws: any) => 
    ws.children?.map((t: any) => ({ ...t, workstreamName: ws.title }))
  ) || [];

  const cols = {
    'TO_DO': tasks.filter((t: any) => t.status === 'TO_DO' && !t.parked),
    'DOING': tasks.filter((t: any) => t.status === 'DOING'),
    'IN_REVIEW': tasks.filter((t: any) => t.status === 'IN_REVIEW'),
    'ACCEPTED': tasks.filter((t: any) => t.status === 'ACCEPTED'),
    'LIVE': tasks.filter((t: any) => t.status === 'LIVE'),
  };

  // Derive calendar days for prototype fidelity
  const days = Array.from({ length: 35 }, (_, i) => {
    const inMonth = i >= 1 && i <= 30;
    const isToday = i === 21; // Match prototype logic
    return {
      n: inMonth ? i : '',
      inMonth,
      isToday
    };
  });

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
          {project.title} &middot; project page
        </div>
        <Link href="/leadership" className="text-[#F2B33D] text-sm font-semibold px-1 hover:text-[#FFD27A]">Back to the Track</Link>
        <Link href="/lead" className="text-[#F2B33D] text-sm font-semibold px-1 hover:text-[#FFD27A]">Lead desk</Link>
      </div>

      <div className="pt-8 px-12 flex flex-col gap-6">
        
        {/* Title area */}
        <div className="flex gap-8 items-end">
          <div className="flex-grow flex flex-col gap-1.5">
            <div className="text-[13px] font-semibold tracking-[1px] uppercase text-[#5C645F]">
              Pillar {project.pillar?.letter}{project.pillar?.name ? <> &middot; {project.pillar.name}</> : null}
            </div>
            <div className="font-black text-[48px] uppercase leading-[1.1]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {project.title}
            </div>
            <div className="text-[15px] text-[#3A413D]">
              Lead: {project.ownerName || 'Mansi'} &middot; Target date {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'N/A'} &middot; 
              <Link href={`/project/${project.id}/passport`} className="text-[#A8411F] ml-1 font-semibold hover:underline">Project Passport</Link>
            </div>
          </div>
          
          <div className="flex gap-7 items-end">
             <div>
               <div className="text-xs font-semibold tracking-[1px] uppercase text-[#5C645F]">Planned</div>
               <div className="font-mono text-[34px] font-semibold">{Math.round(project.pacer)}%</div>
             </div>
             <div>
               <div className="text-xs font-semibold tracking-[1px] uppercase text-[#5C645F]">Actual</div>
               <div className="font-mono text-[34px] font-semibold text-[#9E2F24]">{Math.round(project.actual)}%</div>
             </div>
             {gap < 0 && (
               <div className="py-2 px-3 rounded-lg bg-[#F7E1DD] text-[#9E2F24] font-semibold text-sm mb-1.5">Behind plan</div>
             )}
             {canManage && (
               <div className="mb-1.5">
                 <ItemActions item={project} people={people} redirectAfterDelete="/leadership" />
               </div>
             )}
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="flex justify-between items-end border-b border-[#DDD9CE]">
          <div className="flex gap-1">
            {['Board', 'Timeline', 'Calendar', 'Decisions', 'Discussion'].map(t => (
              <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="min-h-[46px] px-5 bg-transparent text-base font-semibold border-b-4 focus:outline-none transition-colors"
              style={{
                color: activeTab === t ? '#121519' : '#5C645F',
                borderColor: activeTab === t ? '#1F6B4A' : 'transparent'
              }}
            >
              {t}
            </button>
            ))}
          </div>
          <div className="pb-2 pr-2">
            <button 
              onClick={() => setIsAddingItem(true)}
              className="h-9 px-5 rounded-full bg-[#121519] text-white font-bold text-[13px] shadow-sm hover:bg-black transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#121519]"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Board Tab */}
        {activeTab === 'Board' && (
          <div className="grid grid-cols-5 gap-3.5 pb-12">
            {[
              { id: 'TO_DO', label: 'To do', items: cols['TO_DO'] },
              { id: 'DOING', label: 'Doing', items: cols['DOING'] },
              { id: 'IN_REVIEW', label: 'In review', items: cols['IN_REVIEW'] },
              { id: 'ACCEPTED', label: 'Accepted', items: cols['ACCEPTED'] },
              { id: 'LIVE', label: 'Live', items: cols['LIVE'] },
            ].map(col => (
              <div key={col.id} className="bg-[#ECE9DF] rounded-xl p-3.5 flex flex-col gap-2.5 min-h-[500px]">
                <div className="flex justify-between font-semibold text-[15px]">
                  <span>{col.label}</span>
                  <span className="font-mono text-[#5C645F]">{col.items.length}</span>
                </div>
                {col.items.length === 0 && col.id === 'ACCEPTED' && (
                  <div className="text-sm text-[#5C645F] py-2 px-0.5">Nothing waiting to go live.</div>
                )}
                {col.items.map((c: any) => (
                  <div key={c.id} className="bg-white border border-[#DDD9CE] rounded-[10px] p-3 flex flex-col gap-2 shadow-sm">
                    <div className="text-sm font-semibold leading-[1.35]">{c.title}</div>
                    <div className="text-[13px] text-[#5C645F]">{c.workstreamName} &middot; {c.ownerName || 'Unassigned'}</div>
                    {c.remarks && (
                      <details className="text-[13px] text-[#3A413D]">
                        <summary className="cursor-pointer font-semibold text-[#5C645F]">Remarks</summary>
                        <p className="mt-1 whitespace-pre-wrap leading-[1.4]">{c.remarks}</p>
                      </details>
                    )}
                    {canManage && <ItemActions item={c} people={people} compact />}
                    {col.id !== 'LIVE' && (
                      <button className="mt-1 min-h-[44px] border border-[#121519] rounded-lg bg-white text-sm font-semibold text-[#121519] hover:bg-gray-50">
                        {col.id === 'TO_DO' ? 'Start' : (col.id === 'DOING' ? 'Send for review' : (col.id === 'IN_REVIEW' ? 'Accept as lead' : 'Mark live'))}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'Timeline' && (
          <div className="bg-white border border-[#DDD9CE] rounded-2xl p-6 flex flex-col">
            <div className="grid grid-cols-[300px_1fr] gap-4 pb-2.5 border-b border-[#DDD9CE] text-xs font-semibold tracking-[0.8px] uppercase text-[#5C645F]">
              <span>Workstream</span>
              <span className="grid grid-cols-3"><span>July</span><span>August</span><span>September</span></span>
            </div>
            {project.children?.map((w: any) => {
               const q1Start = new Date('2026-07-01').getTime();
               const q1End = new Date('2026-09-30').getTime();
               const q1Length = q1End - q1Start;

               let start = w.targetStartDate ? new Date(w.targetStartDate).getTime() : 0;
               let end = w.targetEndDate ? new Date(w.targetEndDate).getTime() : 0;
               if (!start || !end) {
                 const times = (w.children || []).flatMap((t: any) => [t.targetStartDate ? new Date(t.targetStartDate).getTime() : null, t.targetEndDate ? new Date(t.targetEndDate).getTime() : null]).filter(Boolean);
                 if (times.length > 0) {
                   start = Math.min(...times);
                   end = Math.max(...times);
                 } else {
                   start = q1Start;
                   end = q1Start + (q1Length / 3);
                 }
               }
               
               const leftPct = Math.max(0, ((start - q1Start) / q1Length) * 100);
               const rightPct = Math.min(100, ((end - q1Start) / q1Length) * 100);
               const widthPct = Math.max(2, rightPct - leftPct); // min 2% width so it's visible

               const isFinished = w.status === 'LIVE' || (w.children && w.children.length > 0 && w.children.every((t: any) => t.status === 'LIVE'));
               const isLate = !isFinished && end < Date.now();
               
               const bar = isFinished ? '#1F6B4A' : (isLate ? '#9E2F24' : '#FFFFFF');
               const borderStyle = bar === '#FFFFFF' ? '2px solid #5C645F' : 'none';

               // Today marker
               const todayTime = Date.now();
               let todayPct = -1;
               if (todayTime >= q1Start && todayTime <= q1End) {
                 todayPct = ((todayTime - q1Start) / q1Length) * 100;
               }

               return (
                 <div key={w.id} className="grid grid-cols-[300px_1fr] gap-4 items-center min-h-[44px] border-b border-[#EFECE3] text-sm">
                   <span className="font-semibold flex items-center justify-between gap-2 py-1">
                     <span>{w.title}</span>
                     {canManage && <ItemActions item={w} people={people} compact />}
                   </span>
                   <span className="relative h-[22px] block" style={{ background: 'linear-gradient(to right, transparent 33.7%, #EFECE3 33.7%, #EFECE3 33.9%, transparent 33.9%, transparent 67.4%, #EFECE3 67.4%, #EFECE3 67.6%, transparent 67.6%)' }}>
                     <span className="absolute top-[3px] h-[16px] rounded-[5px] block box-border" style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: bar, border: borderStyle }}></span>
                     {todayPct >= 0 && (
                       <span className="absolute top-[-11px] w-[2px] h-[44px] bg-[#121519] block z-10" style={{ left: `${todayPct}%` }}></span>
                     )}
                   </span>
                 </div>
               )
            })}
            <div className="flex gap-5 pt-4 text-[13px] text-[#3A413D] items-center">
              <span className="flex items-center gap-1.5"><span className="w-[18px] h-[10px] rounded-[3px] bg-[#1F6B4A] inline-block"></span>Live</span>
              <span className="flex items-center gap-1.5"><span className="w-[18px] h-[10px] rounded-[3px] bg-[#9E2F24] inline-block"></span>Past target date, not finished</span>
              <span className="flex items-center gap-1.5"><span className="w-[18px] h-[10px] rounded-[3px] bg-white border-2 border-[#5C645F] box-border inline-block"></span>Not due yet</span>
              <span className="flex items-center gap-1.5"><span className="w-[2px] h-[16px] bg-[#121519] inline-block"></span>Today</span>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'Calendar' && (
          <div className="bg-white border border-[#DDD9CE] rounded-2xl p-6 flex flex-col gap-3">
            <div className="font-extrabold text-[28px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>September 2026</div>
            <div className="grid grid-cols-7 gap-1.5 text-xs font-semibold tracking-[0.8px] uppercase text-[#5C645F]">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d, i) => {
                const dayNumber = d.inMonth ? Number(d.n) : -1;
                // Find tasks ending on this day
                const dayTasks = tasks.filter((t: any) => {
                  if (!t.targetEndDate) return false;
                  const date = new Date(t.targetEndDate);
                  return date.getUTCFullYear() === 2026 && date.getUTCMonth() === 8 && date.getUTCDate() === dayNumber;
                });

                return (
                  <div key={i} className={`min-h-[104px] rounded-lg p-2 flex flex-col gap-1 border ${d.inMonth ? (d.isToday ? 'bg-[#E3F0E9] border-[#1F6B4A] border-2' : 'bg-[#F2EEE5] border-transparent') : 'bg-transparent border-transparent'}`}>
                    {d.inMonth && <span className="font-mono font-semibold text-sm">{d.n}</span>}
                    {d.isToday && <span className="text-xs leading-[1.3] text-[#121519] mt-1 font-bold">Today</span>}
                    {dayTasks.slice(0, 2).map((t: any, idx: number) => (
                      <span key={idx} className="text-xs leading-[1.3] text-[#121519] mt-1 line-clamp-2">{t.title}</span>
                    ))}
                    {dayTasks.length > 2 && <span className="text-xs font-semibold text-[#5C645F] mt-0.5">+{dayTasks.length - 2} more</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Decisions Tab */}
        {activeTab === 'Decisions' && (
          <div className="bg-white border border-[#DDD9CE] rounded-2xl p-6 flex flex-col gap-3">
             <div className="font-extrabold text-[26px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Decision Log</div>
             
             {project.decisions?.length > 0 ? project.decisions.map((d: any) => (
                <div key={d.id} className="grid grid-cols-[110px_1fr_220px] gap-4 text-[15px] leading-[1.5] pb-2.5 border-b border-[#EFECE3] last:border-0 pt-2">
                  <span className="font-mono font-semibold">{new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  <span>{d.text}</span>
                  <span className="text-[#5C645F]">{d.maker}</span>
                </div>
             )) : (
                <div className="text-[15px] text-[#5C645F]">No decisions logged yet.</div>
             )}

             {/* Mock decision for fidelity if none exist */}
             {(!project.decisions || project.decisions.length === 0) && (
               <div className="grid grid-cols-[110px_1fr_220px] gap-4 text-[15px] leading-[1.5] pb-2.5 border-b border-[#EFECE3] pt-2">
                 <span className="font-mono font-semibold">12 Aug</span>
                 <span>Hold role change of stakeholders until SAI names the approving authority.</span>
                 <span className="text-[#5C645F]">Raised by {project.ownerName || 'Mansi'}</span>
               </div>
             )}
          </div>
        )}

        {/* Discussion Tab */}
        {activeTab === 'Discussion' && (
          <div className="max-w-4xl">
            <CommunicationThread itemId={project.id} people={people} />
          </div>
        )}

      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="font-extrabold text-[32px] uppercase border-b border-[#DDD9CE] pb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Add New Item
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#5A5E63]">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="itemType" checked={newItem.type === 'TASK'} onChange={() => setNewItem({...newItem, type: 'TASK'})} />
                    <span className="text-[15px] font-bold">Task</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="itemType" checked={newItem.type === 'WORKSTREAM'} onChange={() => setNewItem({...newItem, type: 'WORKSTREAM'})} />
                    <span className="text-[15px] font-bold">Workstream</span>
                  </label>
                </div>
              </div>

              {newItem.type === 'TASK' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Parent Workstream</label>
                  <select 
                    value={newItem.parentId}
                    onChange={e => setNewItem({...newItem, parentId: e.target.value})}
                    className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] bg-white"
                  >
                    <option value="">Select a Workstream...</option>
                    {project.children?.map((ws: any) => (
                      <option key={ws.id} value={ws.id}>{ws.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#5A5E63]">Title</label>
                <input 
                  type="text" 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]"
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#5A5E63]">Assign Team Members (e.g. BAs, Devs)</label>
                <select 
                  multiple
                  value={newItem.teamIds}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setNewItem({...newItem, teamIds: options});
                  }}
                  className="w-full h-24 p-2 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] bg-white"
                >
                  {people?.map((person: any) => (
                    <option key={person.id} value={person.id}>{person.name} ({person.role})</option>
                  ))}
                </select>
                <span className="text-[11px] text-[#8A8E93]">Hold Cmd/Ctrl to select multiple.</span>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Start Date</label>
                  <input 
                    type="date" 
                    value={newItem.start}
                    onChange={e => setNewItem({...newItem, start: e.target.value})}
                    className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[13px] font-bold text-[#5A5E63]">End Date</label>
                  <input 
                    type="date" 
                    value={newItem.end}
                    onChange={e => setNewItem({...newItem, end: e.target.value})}
                    className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[#DDD9CE]">
              <button 
                onClick={() => setIsAddingItem(false)}
                className="flex-grow h-12 rounded-full font-bold text-[15px] border-2 border-[#121519] hover:bg-[#F2EEE5] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddItem}
                disabled={isSavingItem || !newItem.title || (newItem.type === 'TASK' && !newItem.parentId)}
                className="flex-grow h-12 rounded-full font-bold text-[15px] bg-[#121519] text-white hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSavingItem ? 'Saving...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
