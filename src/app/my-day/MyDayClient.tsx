"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function MyDayClient({ initialTasks }: { initialTasks: any[] }) {
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [wrapped, setWrapped] = useState(false);
  const [wrapTime, setWrapTime] = useState("");
  const [helpState, setHelpState] = useState(0); // 0: closed, 1: open, 2: sent
  const [mood, setMood] = useState(-1);
  const [tasks, setTasks] = useState(initialTasks.length > 0 ? initialTasks : [
    { id: 1, title: "Child consent form", ws: "Consent management · target was 31 Jul", s: 1, s0: 1, on: true },
    { id: 2, title: "Consent logs", ws: "Consent management · target was 31 Jul", s: 1, s0: 1, on: true },
    { id: 3, title: "Local language consent content", ws: "Consent management · target was 31 Jul", s: 0, s0: 0, on: true }
  ]);

  const nowString = () => {
    const d = new Date();
    let h = d.getHours();
    const m = d.getMinutes();
    const ap = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m < 10 ? '0'+m : m} ${ap}`;
  };

  const statusNames = ["To do", "Doing", "In review"];
  const statusHints = ["Tap when you begin", "Tap to send for review", "With Mansi to accept"];
  const shownTasks = started ? tasks.filter((t: any) => t.on) : tasks;

  const toggleTask = (id: any) => {
    setTasks(tasks.map((t: any) => t.id === id ? { ...t, on: !t.on } : t));
  };

  const advanceTask = (id: any, currentStatus: number) => {
    if (currentStatus < 2) {
      setTasks(tasks.map((t: any) => t.id === id ? { ...t, s: t.s + 1 } : t));
    }
  };

  const inReviewCount = tasks.filter((t: any) => t.s === 2 && t.s0 < 2).length;
  const goalDone = 4;
  const moved = tasks.filter((t: any) => t.s > t.s0).length;

  return (
    <div className="w-full min-h-[100vh] bg-[#F2EEE5] text-[#121519] font-sans flex flex-col items-center" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* Mobile container constraint */}
      <div className="w-full max-w-[390px] min-h-[100vh] flex flex-col bg-[#F2EEE5] border-x border-[#DDD9CE]">
        
        {/* Header */}
        <div className="p-5 pb-4 bg-[#121519] text-[#F2EEE5] flex flex-col gap-3.5">
          <div className="flex justify-between items-center">
            <div className="font-extrabold text-[22px] tracking-[1px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              My Day
            </div>
            <Link href="/privacy" className="text-[#F2B33D] text-[13px] font-semibold py-3 hover:text-[#FFD27A]">
              What others see about me
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[13px] font-bold tracking-[1.2px] uppercase text-[#B9B5AC]">Team goal this week</span>
              <span className="font-mono text-sm font-bold">{goalDone} of 6 accepted</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map(i => {
                const c = i < goalDone ? "#8FE0B8" : (i < goalDone + inReviewCount ? "#F2B33D" : "#3A404A");
                return <span key={i} className="h-3 rounded-full block" style={{ background: c }}></span>;
              })}
            </div>
            <div className="text-[13px] text-[#B9B5AC]">Consent management team &middot; by Friday &middot; set with Mansi</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3.5">
          <div className="font-mono text-xs text-[#5A5E63] text-center">Mon 21 Sep</div>

          <div className="self-start max-w-[300px] bg-white rounded-[18px] rounded-br-[4px] py-3.5 px-4 text-base leading-[1.45] shadow-sm">
            Morning, teammate. On Friday you were on these three. Same today?
          </div>

          <div className="flex flex-col gap-2">
            {shownTasks.map((t: any) => {
              const ring = !started && !t.on ? "#E6E0D3" : (t.s === 2 ? "#1F6B4A" : "#121519");
              const bg = t.s === 0 ? "#E6E0D3" : (t.s === 1 ? "#121519" : "#1F6B4A");
              const fg = t.s === 0 ? "#121519" : "#FFFFFF";

              return (
                <div key={t.id} className="bg-white border-2 rounded-[14px] p-3.5 flex flex-col gap-2.5 transition-colors" style={{ borderColor: ring }}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-bold leading-[1.3]">{t.title}</span>
                    <span className="text-[13px] text-[#5A5E63]">{t.ws}</span>
                  </div>
                  
                  {!started && (
                    <button 
                      onClick={() => toggleTask(t.id)} 
                      className="self-start min-h-[44px] px-4 rounded-full border-2 border-[#121519] text-sm font-bold transition-colors"
                      style={{ background: t.on ? "#121519" : "#FFFFFF", color: t.on ? "#F2EEE5" : "#121519" }}
                    >
                      {t.on ? "Today: yes" : "Not today"}
                    </button>
                  )}
                  
                  {started && (
                    <div className="flex gap-2.5 items-center">
                      <button 
                        onClick={() => advanceTask(t.id, t.s)}
                        className="min-h-[44px] px-4 rounded-full font-bold text-sm transition-colors"
                        style={{ background: bg, color: fg }}
                      >
                        {statusNames[t.s]}
                      </button>
                      <span className="text-[13px] text-[#5A5E63]">{statusHints[t.s]}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {!started && (
            <button 
              onClick={() => { setStarted(true); setStartTime(nowString()); }}
              className="min-h-[52px] rounded-full bg-[#121519] text-[#F2EEE5] text-[17px] font-bold mt-2 shadow-md"
            >
              Yes, start my day
            </button>
          )}

          {started && (
            <>
              <div className="self-end max-w-[280px] bg-[#121519] text-[#F2EEE5] rounded-[18px] rounded-bl-[4px] py-3 px-4 text-[15px] shadow-sm">
                Starting with {tasks.filter((t: any) => t.on).length} tasks.
              </div>
              <div className="self-start max-w-[300px] bg-white rounded-[18px] rounded-br-[4px] py-3.5 px-4 text-[15px] leading-[1.45] shadow-sm">
                Noted at {startTime}. Tap a status when something moves. That's all I need from you until evening.
              </div>
            </>
          )}

          {/* Appreciation (Win) module */}
          <div className="self-start max-w-[320px] bg-[#E3F0E9] rounded-[18px] rounded-br-[4px] py-3.5 px-4 flex flex-col gap-1 shadow-sm mt-2">
            <span className="text-xs font-extrabold tracking-[1.2px] uppercase text-[#1F6B4A]">Appreciation from SAI</span>
            <span className="text-[15px] leading-[1.45]">RBAC role design and backend both closed on their target date. Thank you.</span>
            <span className="text-xs text-[#3A5A4A] mt-0.5">[SAI officer] &middot; copied to Mansi</span>
          </div>

          {/* Help module */}
          {helpState === 0 && (
            <button 
              onClick={() => setHelpState(1)}
              className="min-h-[48px] rounded-full border-2 border-[#121519] bg-transparent text-[#121519] text-[15px] font-bold mt-2"
            >
              Something's stuck
            </button>
          )}
          {helpState === 1 && (
            <div className="bg-white rounded-[14px] p-3.5 flex flex-col gap-2.5 mt-2 shadow-sm border border-[#DDD9CE]">
              <label htmlFor="stuck" className="text-[15px] font-bold">What's stuck, and who could clear it?</label>
              <textarea 
                id="stuck" 
                rows={3} 
                className="w-full p-2.5 rounded-lg border border-[#8A8E93] text-[15px] leading-[1.4] resize-none focus:outline-none focus:border-[#121519]"
                defaultValue="SMTP details from CDAC have not arrived, so notification testing cannot start."
              ></textarea>
              <button 
                onClick={() => setHelpState(2)}
                className="min-h-[46px] rounded-full bg-[#121519] text-[#F2EEE5] text-[15px] font-bold"
              >
                Send to Mansi
              </button>
            </div>
          )}
          {helpState === 2 && (
            <div className="self-start max-w-[300px] bg-white rounded-[18px] rounded-br-[4px] py-3.5 px-4 text-[15px] leading-[1.45] shadow-sm mt-2">
              Sent to Mansi. It's on her desk now, and you should hear back by tomorrow morning. This counts as a hurdle, not a delay on you.
            </div>
          )}

          {/* Wrap up module */}
          {started && !wrapped && (
            <button 
              onClick={() => { setWrapped(true); setWrapTime(nowString()); }}
              className="min-h-[52px] rounded-full bg-[#B5472A] text-white text-[17px] font-bold mt-4 shadow-md"
            >
              Wrap up the day
            </button>
          )}

          {wrapped && (
            <>
              <div className="self-start max-w-[310px] bg-white rounded-[18px] rounded-br-[4px] py-3.5 px-4 text-[15px] leading-[1.45] shadow-sm mt-4">
                Wrapped at {wrapTime}. {moved > 0 ? `You moved ${moved} task${moved > 1 ? 's' : ''} today, and the team goal is closer. See you tomorrow.` : "Nothing moved today, and that happens. If something is in the way, say so tomorrow morning."}
              </div>
              <div className="self-start max-w-[310px] bg-white rounded-[18px] rounded-br-[4px] py-3.5 px-4 flex flex-col gap-2.5 shadow-sm mt-2">
                <span className="text-[15px] leading-[1.45]">How was today? Optional. Only team totals are ever shown, never your name.</span>
                <div className="flex gap-2">
                  {["Good", "Okay", "Tough"].map((l, i) => (
                    <button 
                      key={l}
                      onClick={() => setMood(i)}
                      className="min-h-[44px] px-3.5 rounded-full border-2 border-[#121519] text-sm font-bold transition-colors"
                      style={{ background: mood === i ? "#121519" : "#FFFFFF", color: mood === i ? "#F2EEE5" : "#121519" }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#121519] text-[#F2EEE5] rounded-[14px] py-3.5 px-4 text-[13px] leading-[1.45] mt-2 shadow-sm">
                Saved to your timesheet and your monthly report. Download it any time from "What others see about me".
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
