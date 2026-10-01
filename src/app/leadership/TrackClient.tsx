"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CommunicationThread from '@/components/CommunicationThread';
import ItemActions from '@/components/ItemActions';

const STATUS_LABEL: Record<string, string> = {
  TO_DO: 'To do', DOING: 'Doing', IN_REVIEW: 'In review', ACCEPTED: 'Accepted', LIVE: 'Live',
};

// Sheet-style numbering ("2. Login design") decides the order; titles without a number keep the order they came in.
const leadingNumber = (title: string) => {
  const m = /^\s*(\d+)\s*[.)]/.exec(title);
  return m ? Number(m[1]) : null;
};
const sortTasks = (tasks: any[]) =>
  [...tasks].sort((a, b) => {
    const x = leadingNumber(a.title);
    const y = leadingNumber(b.title);
    return x !== null && y !== null ? x - y : 0;
  });

const fmtDay = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtRange = (start?: string | Date | null, end?: string | Date | null) =>
  start && end ? `${fmtDay(start)} to ${fmtDay(end)}` : start ? `from ${fmtDay(start)}` : end ? `by ${fmtDay(end)}` : 'No dates';

export default function TrackClient({ projects, mission, headline, people, canManage }: any) {
  const [selIndex, setSelIndex] = useState<number | null>(0);
  // Workstreams whose sub tasks are shown
  const [openWs, setOpenWs] = useState<Set<string>>(new Set());
  const toggleWs = (id: string) =>
    setOpenWs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const router = useRouter();
  
  // Universal Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ 
    title: '', 
    type: 'PROJECT', // PROJECT | WORKSTREAM | TASK
    projectId: '',   // Used when type is WORKSTREAM (parent) or TASK (to filter workstreams)
    workstreamId: '',// Used when type is TASK (parent)
    start: '', 
    end: '', 
    teamIds: [] as string[] 
  });
  const [isSavingItem, setIsSavingItem] = useState(false);

  const handleAddItem = async () => {
    if (!newItem.title) return;
    if (newItem.type === 'TASK' && !newItem.workstreamId) return;
    if (newItem.type === 'WORKSTREAM' && !newItem.projectId) return;

    let finalParentId = null;
    if (newItem.type === 'TASK') finalParentId = newItem.workstreamId;
    if (newItem.type === 'WORKSTREAM') finalParentId = newItem.projectId;

    setIsSavingItem(true);
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newItem.title,
        parentId: finalParentId, 
        type: newItem.type,
        targetStartDate: newItem.start || null,
        targetEndDate: newItem.end || null,
        teamIds: newItem.teamIds
      })
    });
    setIsAddingItem(false);
    setNewItem({ title: '', type: 'PROJECT', projectId: '', workstreamId: '', start: '', end: '', teamIds: [] });
    router.refresh();
    setIsSavingItem(false);
  };
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="w-full min-h-screen bg-[#F2EEE5] text-[#121519] font-sans flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-7 py-4 px-12 border-b border-[#DDD9CE]">
        <div className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#B5472A" strokeWidth="3">
            <path d="M4 12h18a8 8 0 0 1 0 16H4"></path>
            <path d="M4 6h18a14 14 0 0 1 0 28"></path>
          </svg>
          <div className="font-extrabold text-[26px] tracking-wide uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            KHEL SETU
          </div>
        </div>
        <div className="text-sm text-[#5A5E63] flex-grow">
          {dateStr} &middot; data as of now
        </div>
        <input 
          type="text" 
          placeholder="Ask: why is Khelo India Website stuck?" 
          className="w-[300px] h-10 rounded-full bg-white border border-[#DDD9CE] px-4 text-sm focus:outline-none focus:border-[#121519] transition-colors"
        />
        <a href="/snapshot" className="h-10 px-5 rounded-full border-2 border-[#121519] text-[13px] font-bold flex items-center justify-center hover:bg-black hover:text-[#F2EEE5] transition-colors">
          Share snapshot
        </a>
        <div className="w-10 h-10 rounded-full bg-white border border-[#DDD9CE] flex items-center justify-center font-bold text-sm">
          IT
        </div>
      </div>

      {/* Main Track Grid */}
      <div className="px-12 pb-24 flex flex-col gap-10">
        <div className="flex flex-col">
          <div className="font-black text-[32px] tracking-wide uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            The Track
          </div>
          <div className="text-[13px] text-[#5A5E63]">
            Each project races only its own pacer. Lanes follow the pillars, never a ranking. Tap a lane to zoom in.
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-[#DDD9CE] overflow-hidden">
          <div className="grid grid-cols-[300px_1fr_170px] px-5 py-3 text-[11px] font-extrabold tracking-[1.4px] uppercase text-[#5A5E63] border-b border-[#DDD9CE]">
            <span>Lane &middot; Project</span>
            <span className="flex justify-between"><span>Start</span><span>Finish</span></span>
            <span className="pl-4">Against Pacer</span>
          </div>

          {projects.map((p: any, i: number) => {
            const gap = p.actual - p.pacer;
            const isFinished = p.actual >= 99.5;
            let gapNum, gapWord, gapColor;
            
            let badgeBg, badgeText;
            if (isFinished) {
              gapNum = "Finished";
              gapWord = "delivered";
              gapColor = "#1F6B4A";
              badgeBg = "#E3F0E9";
              badgeText = "#1F6B4A";
            } else if (gap >= 0) {
              gapNum = "+" + Math.round(gap);
              gapWord = "ahead of pacer";
              gapColor = "#1F6B4A";
              badgeBg = "#E3F0E9";
              badgeText = "#1F6B4A";
            } else {
              gapNum = Math.round(gap); // negative
              gapWord = "points behind pacer";
              gapColor = "#B5472A";
              badgeBg = "#F7E6E2";
              badgeText = "#B5472A";
            }

            const sel = selIndex === i;
            const bg = sel ? "#F2EEE5" : "transparent"; // Lighter selected background
            const trackBg = i % 2 === 0 ? "#B5472A" : "#A8411F";
            const tokBg = isFinished ? "#8FE0B8" : "#FFFFFF"; // Changed token bg to white/green
            const borderCol = sel ? "border-[#121519]" : "border-[#DDD9CE]";

            return (
              <div key={p.id} className="flex flex-col">
                {/* Lane Header */}
                <button 
                  onClick={() => setSelIndex(sel ? null : i)} 
                  className={`grid grid-cols-[300px_1fr_170px] w-full min-h-[64px] border-b ${borderCol} text-left items-stretch transition-all duration-200 hover:bg-[#F4F1EB] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:z-10 relative group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#121519]`} 
                  style={{ background: bg }}
                >
                   <span className="flex items-center gap-3.5 pl-5 py-2">
                     <span className="font-black text-[26px] w-[22px]" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: sel ? '#B5472A' : '#A8A49C' }}>{p.pillar?.letter || 'A'}</span>
                     <span className="text-[15px] leading-tight text-[#121519]" style={{ fontWeight: sel ? 800 : 500 }}>{p.title}</span>
                   </span>
                   
                   <span className="relative block border-l-2 border-white my-[11px]" style={{ background: trackBg }}>
                     <span className="absolute left-0 right-0 top-0 h-[2px] bg-white opacity-40 block"></span>
                     
                     {/* Pacer ring */}
                     <span className="absolute top-[3px] w-[36px] h-[36px] rounded-full border-2 border-dashed border-white opacity-80 box-border block" style={{ left: `calc(${p.pacer * 0.9}% - 18px)` }}></span>
                     
                     {/* Hurdles */}
                     {p.allHurdles?.map((h: any, j: number) => {
                       const c = h.whoClears === 'TEAM' ? '#FFFFFF' : (h.whoClears === 'SAI_OR_PARTNER' ? '#F2B33D' : '#D0CDCB');
                       return (
                         <span key={h.id} className="absolute top-[10px] block shadow-sm" style={{ left: `calc(${p.actual * 0.9}% + ${30 + j*26}px)` }}>
                           <svg width="24" height="22" viewBox="0 0 22 18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={h.whoClears === 'UNOWNED' ? '3 3' : '0'}>
                             <path d="M3 17V3M19 17V3M3 5h16"></path>
                           </svg>
                         </span>
                       );
                     })}
                     
                     {/* Actual token */}
                     <span className="absolute top-[1px] w-[40px] h-[40px] rounded-full text-[#121519] flex items-center justify-center font-bold text-[14px] font-mono shadow-[0_4px_12px_rgba(0,0,0,0.18)] border-2 border-[#121519] transition-transform duration-300 group-hover:scale-105" style={{ background: tokBg, left: `calc(${p.actual * 0.9}% - 20px)` }}>
                       {Math.round(p.actual)}
                     </span>
                   </span>
                   
                   <span className="flex items-center pl-4 py-2">
                     <span className="flex flex-col px-3 py-1.5 rounded-lg border border-black/5" style={{ background: badgeBg }}>
                       <span className="font-bold text-[15px] font-mono leading-none" style={{ color: badgeText }}>{gapNum}</span>
                       <span className="text-[9px] uppercase tracking-[0.5px] font-bold mt-1 leading-none opacity-80" style={{ color: badgeText }}>{gapWord}</span>
                     </span>
                   </span>
                </button>

                {/* ACCORDION EXPANSION */}
                <AnimatePresence>
                  {sel && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden bg-[#F2EEE5] border-b-2 border-black shadow-inner"
                    >
                      <div className="px-12 py-8 flex flex-col gap-6 text-[#121519]">
                        <div className="flex items-end gap-6">
                          <div className="flex-grow flex flex-col gap-1">
                            <div className="text-[13px] font-extrabold tracking-[2px] uppercase text-[#5A5E63]">
                              Zoomed in &middot; Pillar {p.pillar?.letter}
                            </div>
                            <div className="font-black text-[44px] leading-[1.05] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                              {p.title}
                            </div>
                          </div>
                          <div className="flex gap-6 items-end">
                            <div>
                              <div className="text-[11px] font-extrabold tracking-[1.4px] uppercase text-[#5A5E63]">Actual</div>
                              <div className="font-black text-[48px] leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{Math.round(p.actual)}%</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-extrabold tracking-[1.4px] uppercase text-[#5A5E63]">Pacer</div>
                              <div className="font-black text-[48px] leading-none text-[#5A5E63]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{Math.round(p.pacer)}%</div>
                            </div>
                            <a href={`/project/${p.id}`} className="min-h-[46px] px-6 rounded-full bg-[#121519] text-white text-[15px] font-bold flex items-center justify-center mb-1 hover:bg-black transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#121519]">
                              Open full project
                            </a>
                            <button 
                              onClick={() => {
                                setNewItem({ title: '', type: 'WORKSTREAM', projectId: p.id, workstreamId: '', start: '', end: '', teamIds: [] });
                                setIsAddingItem(true);
                              }}
                              className="min-h-[46px] px-6 rounded-full border-2 border-[#121519] text-[#121519] text-[15px] font-bold flex items-center justify-center mb-1 hover:bg-[#E2DCCF] transition-colors"
                            >
                              + Add Item (Workstream/Task)
                            </button>
                            {canManage && (
                              <div className="mb-1">
                                <ItemActions item={p} people={people} />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Workstreams */}
                        <div className="grid grid-cols-[1.8fr_1fr] gap-8 bg-white rounded-2xl p-6 shadow-sm border border-[#DDD9CE]">
                          <div className="flex flex-col">
                            <div className="text-[11px] font-extrabold tracking-[1.6px] uppercase text-[#5A5E63] pb-3 border-b border-[#E2DCCF] mb-1">
                              Its own track: workstreams as lanes
                            </div>
                            {p.children?.map((ws: any, i: number) => {
                              const wsActual = ws.actual ?? 0;
                              const wsPacer = ws.pacer ?? 0;
                              const gap = wsActual - wsPacer;
                              const tasks = sortTasks(ws.children ?? []);
                              const isOpen = openWs.has(ws.id);
                              return (
                                <div key={ws.id} className="flex flex-col border-b border-[#E2DCCF]">
                                  <div className={`grid ${canManage ? 'grid-cols-[230px_1fr_60px_auto] gap-x-2' : 'grid-cols-[230px_1fr_60px]'} items-center min-h-[32px]`}>
                                    <button
                                      type="button"
                                      onClick={() => toggleWs(ws.id)}
                                      aria-expanded={isOpen}
                                      aria-label={`${isOpen ? 'Hide' : 'Show'} the ${tasks.length} sub tasks of ${ws.title}`}
                                      className="flex items-center gap-1.5 text-left text-[13px] font-bold pr-2 text-[#3A3E44] hover:text-[#121519] min-w-0"
                                    >
                                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}><path d="M4 2l4 4-4 4" /></svg>
                                      <span className="truncate" title={ws.title}>{ws.title}</span>
                                      <span className="shrink-0 font-mono text-[11px] font-normal text-[#5A5E63]">{tasks.length}</span>
                                    </button>
                                    <span className="relative block h-[26px] my-[3px]" style={{ background: i % 2 === 0 ? '#B5472A' : '#A8411F' }}>
                                      <span className="absolute top-[3px] w-[20px] h-[20px] rounded-full border-2 border-dashed border-white box-border block opacity-70" style={{ left: `calc(${wsPacer * 0.92}% - 10px)` }}></span>
                                      <span className="absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white block shadow-sm border-2 border-[#121519]" style={{ left: `calc(${wsActual * 0.92}% - 11px)` }}></span>
                                    </span>
                                    <span className="font-mono text-[13px] font-bold text-right" style={{ color: ws.parked ? '#5A5E63' : gap >= -0.5 ? '#1F6B4A' : '#A8321F' }}>
                                      {ws.parked ? 'parked' : gap >= -0.5 ? 'on pace' : Math.round(gap)}
                                    </span>
                                    {canManage && <ItemActions item={ws} people={people} compact />}
                                  </div>

                                  {isOpen && (
                                    <div className="flex flex-col gap-1.5 pl-5 pb-3 pt-1">
                                      {tasks.length === 0 && (
                                        <div className="text-[13px] italic text-[#5A5E63]">No sub tasks yet.</div>
                                      )}
                                      {tasks.map((t: any) => {
                                        const blocked = (t.hurdles ?? []).some((h: any) => !h.closedAt);
                                        const st = STATUS_LABEL[t.status] ?? t.status;
                                        return (
                                          <div key={t.id} className="flex items-start gap-3 bg-[#F9F8F6] border border-[#E2DCCF] rounded-xl px-3 py-2">
                                            <div className="flex-grow min-w-0 flex flex-col gap-1">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[13px] font-semibold leading-[1.35]">{t.title}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-[#ECE9DF] text-[11px] font-bold text-[#3A3E44]">{st}</span>
                                                {t.parked && <span className="px-2 py-0.5 rounded-full bg-[#ECE9DF] text-[11px] font-bold text-[#5A5E63]">Parked</span>}
                                                {blocked && <span className="px-2 py-0.5 rounded-full bg-[#F7E1DD] text-[11px] font-bold text-[#9E2F24]">Blocked</span>}
                                              </div>
                                              <div className="text-[12px] text-[#5A5E63]">
                                                {t.ownerName || 'Unassigned'} &middot; {fmtRange(t.targetStartDate, t.targetEndDate)}
                                              </div>
                                              {t.remarks && (
                                                <details className="text-[12px] text-[#3A3E44]">
                                                  <summary className="cursor-pointer font-semibold text-[#5A5E63]">Remarks</summary>
                                                  <p className="mt-1 whitespace-pre-wrap leading-[1.4]">{t.remarks}</p>
                                                </details>
                                              )}
                                            </div>
                                            {canManage && <ItemActions item={t} people={people} compact />}
                                          </div>
                                        );
                                      })}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewItem({ title: '', type: 'TASK', projectId: p.id, workstreamId: ws.id, start: '', end: '', teamIds: [] });
                                          setIsAddingItem(true);
                                        }}
                                        className="self-start h-8 px-4 rounded-full border-2 border-[#121519] text-[12px] font-bold hover:bg-[#E2DCCF] transition-colors"
                                      >
                                        + Add sub task
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Hurdles */}
                          <div className="flex flex-col gap-3">
                            <div className="text-[11px] font-extrabold tracking-[1.6px] uppercase text-[#5A5E63] pb-3 border-b border-[#E2DCCF] mb-1">
                              Hurdles in this lane
                            </div>
                            {(!p.allHurdles || p.allHurdles.length === 0) && (
                              <div className="text-[15px] text-[#3A3E44] italic">Nothing stuck. Clear lane.</div>
                            )}
                            {p.allHurdles?.map((h: any) => (
                              <div key={h.id} className="flex gap-3 items-start bg-[#F9F8F6] rounded-xl p-3 border border-[#E2DCCF]">
                                <svg width="24" height="22" viewBox="0 0 22 18" fill="none" stroke={h.whoClears === 'TEAM' ? '#121519' : (h.whoClears === 'SAI_OR_PARTNER' ? '#B5472A' : '#8C8F94')} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={h.whoClears === 'UNOWNED' ? '3 3' : '0'} className="flex-shrink-0 mt-0.5">
                                  <path d="M3 17V3M19 17V3M3 5h16"></path>
                                </svg>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[15px] font-bold leading-[1.35]">{h.text}</span>
                                  <span className="text-[13px] text-[#5A5E63]">{h.whoClears} &middot; opened {new Date(h.openedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}

                            <div className="mt-4 pt-4 border-t border-[#E2DCCF]">
                              <CommunicationThread itemId={p.id} people={people} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* Universal Add Button at bottom of Track */}
          <button 
            onClick={() => {
              setNewItem({ title: '', type: 'PROJECT', projectId: '', workstreamId: '', start: '', end: '', teamIds: [] });
              setIsAddingItem(true);
            }}
            className="flex items-center justify-center gap-2 p-4 text-[#121519] hover:bg-[#F2EEE5] transition-colors border-t border-[#DDD9CE] font-bold text-[15px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>
            Add New Track, Workstream, or Task
          </button>
        </div>
      </div>
      
      {/* Universal Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto text-left">
            <h2 className="font-extrabold text-[32px] uppercase border-b border-[#DDD9CE] pb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Add to the Plan
            </h2>
            
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#5A5E63] uppercase tracking-wider">What are you adding?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="itemType" checked={newItem.type === 'PROJECT'} onChange={() => setNewItem({...newItem, type: 'PROJECT', projectId: '', workstreamId: ''})} />
                    <span className="text-[15px] font-bold">Track (Project)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="itemType" checked={newItem.type === 'WORKSTREAM'} onChange={() => setNewItem({...newItem, type: 'WORKSTREAM', workstreamId: ''})} />
                    <span className="text-[15px] font-bold">Workstream</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="itemType" checked={newItem.type === 'TASK'} onChange={() => setNewItem({...newItem, type: 'TASK'})} />
                    <span className="text-[15px] font-bold">Sub-task</span>
                  </label>
                </div>
              </div>

              {(newItem.type === 'WORKSTREAM' || newItem.type === 'TASK') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Parent Track (Project)</label>
                  <select 
                    value={newItem.projectId}
                    onChange={e => setNewItem({...newItem, projectId: e.target.value, workstreamId: ''})}
                    className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] bg-white font-semibold"
                  >
                    <option value="">Select a Track...</option>
                    {projects.map((pr: any) => (
                      <option key={pr.id} value={pr.id}>{pr.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {newItem.type === 'TASK' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Parent Workstream</label>
                  <select 
                    value={newItem.workstreamId}
                    onChange={e => setNewItem({...newItem, workstreamId: e.target.value})}
                    disabled={!newItem.projectId}
                    className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] bg-white font-semibold disabled:opacity-50"
                  >
                    <option value="">Select a Workstream...</option>
                    {newItem.projectId && projects.find((pr: any) => pr.id === newItem.projectId)?.children?.map((ws: any) => (
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
                  className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] font-bold"
                  placeholder="e.g. Khelo India Redesign"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#5A5E63]">Assign Team Members</label>
                <select 
                  multiple
                  value={newItem.teamIds}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setNewItem({...newItem, teamIds: options});
                  }}
                  className="w-full h-24 p-2 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] bg-white font-semibold"
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
                disabled={isSavingItem || !newItem.title || (newItem.type === 'TASK' && !newItem.workstreamId) || (newItem.type === 'WORKSTREAM' && !newItem.projectId)}
                className="flex-grow h-12 rounded-full font-bold text-[15px] bg-[#121519] text-white hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSavingItem ? 'Saving...' : 'Add to Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
