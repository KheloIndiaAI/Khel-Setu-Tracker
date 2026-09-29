"use client";

import { useState } from 'react';

export default function LeadClient({ projects, user }: any) {
  const [reviews, setReviews] = useState([
    { id: 1, title: "PE teacher module enhancement", meta: "Onboarding of PE Teachers · Narendra, Nazim · on UAT", status: 'open' },
    { id: 2, title: "Workflow Engine as a service", meta: "Workflow Engine · Rohit, Nishant S · 31 days past target", status: 'open' }
  ]);
  
  const [helpStatus, setHelpStatus] = useState<number>(0);
  const [chase, setChase] = useState([false, false, false]);

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="w-full min-h-screen bg-[#F2EEE5] text-[#121519] font-sans flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
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
          Lead desk &middot; {dateStr}
        </div>
        <a href="/leadership" className="text-[#F2B33D] text-sm font-semibold px-1 py-3 hover:text-[#FFD27A]">
          See the full Track
        </a>
        <div className="w-11 h-11 rounded-full bg-[#B5472A] text-[#F2EEE5] flex items-center justify-center font-bold">
          {user?.name?.[0] || 'L'}
        </div>
      </div>

      {/* Greeting */}
      <div className="pt-8 px-12 flex items-end gap-8">
        <div className="flex-grow">
          <div className="font-black text-[64px] leading-[0.95] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Morning, {user?.name?.split(' ')[0] || 'Lead'}
          </div>
          <div className="text-[17px] text-[#3A3E44] pt-2">
            Four things moved overnight, one person needs you, and your DG review pack is already built.
          </div>
        </div>
        <div className="bg-[#121519] text-[#F2EEE5] rounded-[18px] py-4 px-5 flex gap-4 items-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8FE0B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 2"></path>
          </svg>
          <div>
            <div className="font-extrabold text-[30px] leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>No Excel this week</div>
            <div className="text-sm text-[#B9B5AC]">Status, Gantt and review slides come from the live data.</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="pt-7 px-12 grid grid-cols-[1.25fr_1fr] gap-6 pb-12">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          
          {/* Accept or return */}
          <div className="bg-white rounded-[18px] p-6 flex flex-col gap-3.5">
            <div className="flex justify-between items-baseline">
              <div className="font-extrabold text-[28px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Accept or return</div>
              <div className="text-sm text-[#5A5E63]">You accept; the doer never does.</div>
            </div>
            {reviews.map((r, i) => (
              <div key={r.id} className="border-t border-[#E6E0D3] pt-3.5 flex gap-4 items-center">
                <div className="flex-grow flex flex-col gap-1">
                  <span className="text-base font-bold">{r.title}</span>
                  <span className="text-sm text-[#5A5E63]">{r.meta}</span>
                </div>
                {r.status === 'open' ? (
                  <div className="flex gap-2">
                    <button onClick={() => setReviews(prev => prev.map(pr => pr.id === r.id ? { ...pr, status: 'returned' } : pr))} className="min-h-[44px] px-4 rounded-full border-2 border-[#121519] bg-white text-[#121519] text-sm font-bold">Return with a note</button>
                    <button onClick={() => setReviews(prev => prev.map(pr => pr.id === r.id ? { ...pr, status: 'accepted' } : pr))} className="min-h-[44px] px-4 rounded-full bg-[#1F6B4A] text-white text-sm font-bold">Accept</button>
                  </div>
                ) : (
                  <span className={`text-sm font-bold ${r.status === 'accepted' ? 'text-[#1F6B4A]' : 'text-[#5A5E63]'}`}>
                    {r.status === 'accepted' ? 'Accepted. Added to Wins.' : 'Returned with a note'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Someone needs you */}
          <div className="bg-white rounded-[18px] p-6 flex flex-col gap-3.5">
            <div className="font-extrabold text-[28px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Someone needs you</div>
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-full bg-[#E6E0D3] flex items-center justify-center font-bold flex-shrink-0">A</div>
              <div className="flex-grow flex flex-col gap-1">
                <span className="text-base leading-[1.45]"><strong>Afatab:</strong> "SMTP details from CDAC have not arrived, so notification testing cannot start."</span>
                <span className="text-[13px] text-[#5A5E63]">Notification Services &middot; raised 9:40 am &middot; first reply due by tomorrow 9:40 am</span>
              </div>
            </div>
            {helpStatus === 0 ? (
              <div className="flex gap-2 pl-[60px]">
                <button onClick={() => setHelpStatus(1)} className="min-h-[44px] px-4 rounded-full bg-[#F2B33D] text-[#121519] text-sm font-bold">Move to Waiting on us (CDAC)</button>
                <button onClick={() => setHelpStatus(2)} className="min-h-[44px] px-4 rounded-full border-2 border-[#121519] bg-white text-[#121519] text-sm font-bold">I will sort it</button>
              </div>
            ) : (
              <div className="pl-[60px] text-sm font-bold text-[#1F6B4A]">
                {helpStatus === 1 ? 'Moved to Waiting on us with CDAC. Afatab has been told.' : 'Marked as yours. Afatab has been told.'}
              </div>
            )}
          </div>

          {/* Since yesterday (ActivityLog mockup) */}
          <div className="bg-white rounded-[18px] p-6 flex flex-col gap-2.5">
            <div className="font-extrabold text-[28px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Since yesterday</div>
            <div className="text-[15px] leading-[1.5] border-t border-[#E6E0D3] pt-2.5">
              <span className="font-mono text-[13px] text-[#5A5E63]">6:12 pm</span> &middot; Narendra moved PE teacher module enhancement to In review (on UAT).
            </div>
            <div className="text-[15px] leading-[1.5] border-t border-[#E6E0D3] pt-2.5">
              <span className="font-mono text-[13px] text-[#5A5E63]">5:40 pm</span> &middot; Rohit and Nishant S sent Workflow Engine as a service for review.
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* Your Lanes */}
          <div className="bg-[#121519] text-[#F2EEE5] rounded-[18px] p-6 flex flex-col gap-3">
            <div className="font-extrabold text-[28px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Your lanes</div>
            {projects.map((l: any, i: number) => {
              const gap = Math.round(l.actual - l.pacer);
              return (
                <div key={l.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <a href={`/project/${l.id}`} className="font-bold hover:underline hover:text-[#FFD27A]">{l.title}</a>
                    <span className="font-mono" style={{ color: gap >= 0 ? '#8FE0B8' : (gap > -20 ? '#F2B33D' : '#FF8A70') }}>
                      {gap >= 0 ? '+' + gap : gap + ' behind pacer'}
                    </span>
                  </div>
                  <div className="relative h-[34px] rounded-md bg-[#B5472A] border-t-2 border-[#F2EEE5] border-opacity-55 overflow-hidden">
                     <span className="absolute top-[3px] w-[24px] h-[24px] rounded-full border-2 border-dashed border-[#F2EEE5] box-border block" style={{ left: `calc(${l.pacer * 0.86}% - 12px)` }}></span>
                     <span className="absolute top-[2px] w-[26px] h-[26px] rounded-full bg-[#F2EEE5] block" style={{ left: `calc(${l.actual * 0.86}% - 13px)` }}></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chase SAI */}
          <div className="bg-white rounded-[18px] p-6 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <div className="font-extrabold text-[28px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Chase SAI</div>
              <div className="text-[13px] text-[#5A5E63]">Owners get one message with a one-tap action</div>
            </div>
            
            {[
              { age: '40d', text: 'Approving authority for role changes. SAI, IT Division.' },
              { age: '11d', text: 'List of registered athletes for agency mapping. SAI, IT Division.' },
              { age: '[?]', text: 'Where de-duplication runs, NSRS or NSDE. SAI.' },
            ].map((c, i) => (
              <div key={i} className="border-t border-[#E6E0D3] pt-3 flex gap-3.5 items-center">
                <span className="font-black text-[30px] min-w-[64px] text-[#A8411F]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{c.age}</span>
                <span className="flex-grow text-[15px] leading-[1.4]">{c.text}</span>
                {!chase[i] ? (
                  <button onClick={() => setChase(prev => { const n = [...prev]; n[i] = true; return n; })} className="min-h-[44px] px-3.5 rounded-full border-2 border-[#121519] bg-white text-[#121519] text-sm font-bold">Nudge</button>
                ) : (
                  <span className="text-[13px] font-bold text-[#1F6B4A] max-w-[120px]">Sent. Next nudge in 3 days</span>
                )}
              </div>
            ))}
          </div>

          {/* DG Review Pack */}
          <div className="bg-[#F2B33D] rounded-[18px] p-6 flex flex-col gap-2.5">
            <div className="font-extrabold text-[28px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>DG review pack: ready</div>
            <div className="text-[15px] leading-[1.45]">Built from this morning's data for your three projects: the Track, what moved, what waits on SAI, and decisions needed. No slides to make by hand.</div>
            <a href="/snapshot" className="min-h-[46px] rounded-full bg-[#121519] text-[#F2EEE5] flex items-center justify-center font-bold text-[15px] mt-2">Preview the pack</a>
          </div>

        </div>
      </div>
    </div>
  );
}
