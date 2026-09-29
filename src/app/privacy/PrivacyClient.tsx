"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function PrivacyClient() {
  const [prefs, setPrefs] = useState([false, true, true, true]);
  const [downloading, setDownloading] = useState(false);

  const workItems = [
    { what: "Your tasks, their status and your notes on them", who: "Everyone working on NSDE, including SAI" },
    { what: "When you start and wrap up your day", who: "You, Mansi (your lead) and the Head of IT Division. Never published or ranked." },
    { what: "Your monthly summary", who: "You and Mansi. You can download it." },
    { what: "How your day was", who: "No one by name. Shown only as a team total, and only when 5 or more people answer." }
  ];

  const prefDefinitions = [
    { label: "Birthday", sub: "Greeting on the team page on the day" },
    { label: "Interests", sub: "Cricket, photography" },
    { label: "Photo", sub: "Shown next to your name" },
    { label: "Work anniversary", sub: "Joined NSDE team: [date]" }
  ];

  const togglePref = (i: number) => {
    const newPrefs = [...prefs];
    newPrefs[i] = !newPrefs[i];
    setPrefs(newPrefs);
  };

  return (
    <div className="w-full min-h-[100vh] bg-[#F2EEE5] text-[#121519] font-sans flex flex-col items-center" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* Mobile constraint */}
      <div className="w-full max-w-[390px] min-h-[100vh] bg-[#F2EEE5] flex flex-col gap-4.5 p-5 border-x border-[#DDD9CE]">
        
        <Link href="/my-day" className="text-[#A8411F] text-sm font-semibold py-2.5 self-start hover:underline">
          Back to My Day
        </Link>
        
        <div className="font-black text-[44px] leading-[0.95] uppercase mt-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          What others see about me
        </div>
        
        <div className="text-[15px] leading-[1.5] text-[#3A3E44] mt-3">
          Everything the platform holds about you, and exactly who can see it. You can check this page at any time.
        </div>

        <div className="bg-[#121519] text-[#F2EEE5] rounded-2xl p-4 text-[15px] leading-[1.5] mt-4 shadow-sm">
          <strong>Never collected:</strong> screen activity, keystrokes, location, time spent in apps. The platform only knows what you tell it.
        </div>

        <div className="flex flex-col bg-white rounded-2xl px-4 py-1 mt-4 shadow-sm border border-[#DDD9CE]">
          {workItems.map((w, i) => (
            <div key={i} className={`flex flex-col gap-1 py-3.5 ${i === 0 ? '' : 'border-t border-[#E6E0D3]'}`}>
              <span className="text-[15px] font-bold">{w.what}</span>
              <span className="text-sm leading-[1.4] text-[#3A3E44]">{w.who}</span>
            </div>
          ))}
        </div>

        <div className="font-extrabold text-[24px] uppercase pt-4 mt-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          Your choice
        </div>

        <div className="flex flex-col bg-white rounded-2xl px-4 py-1 mt-1 shadow-sm border border-[#DDD9CE]">
          {prefDefinitions.map((p, i) => {
            const on = prefs[i];
            return (
              <div key={i} className={`flex gap-3 items-center py-3 ${i === 0 ? '' : 'border-t border-[#E6E0D3]'}`}>
                <div className="flex-grow flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{p.label}</span>
                  <span className="text-[13px] text-[#5A5E63]">{on ? `${p.sub} · visible to the team` : "Hidden"}</span>
                </div>
                <button 
                  onClick={() => togglePref(i)}
                  className="w-[60px] h-[44px] flex items-center justify-center focus:outline-none"
                  aria-label={p.label + (on ? ": visible, tap to hide" : ": hidden, tap to show")}
                >
                  <span className="w-[52px] h-[30px] rounded-[15px] relative block transition-colors" style={{ background: on ? "#1F6B4A" : "#8A8E93" }}>
                    <span 
                      className="absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white block transition-all shadow-sm"
                      style={{ left: on ? "25px" : "3px" }}
                    ></span>
                  </span>
                </button>
              </div>
            )
          })}
        </div>

        <button 
          onClick={() => setDownloading(true)}
          className="min-h-[50px] rounded-full border-2 border-[#121519] text-[15px] font-bold mt-5 mb-8 transition-colors"
          style={{ background: downloading ? "#121519" : "transparent", color: downloading ? "#F2EEE5" : "#121519" }}
        >
          {downloading ? "September report prepared for download" : "Download my September report"}
        </button>

      </div>
    </div>
  );
}
