"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function OwnerEmailClient() {
  const [one, setOne] = useState("");
  const [two, setTwo] = useState(0); // 0: open, 1: uploaded, 2: delegated
  const [featureFlag, setFeatureFlag] = useState(true);

  const options = ["DD, IT Division", "Director, Operations", "Someone else"];
  const leftCount = (one ? 0 : 1) + (two ? 0 : 1);
  const headline = leftCount === 0 ? "All clear. Thank you." : (leftCount === 1 ? "1 thing is waiting on you" : "2 things are waiting on you");

  if (!featureFlag) {
    return (
      <div className="w-full min-h-[100vh] bg-[#E6E0D3] text-[#121519] font-sans flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Feature Flag Disabled</h2>
          <p className="text-[#5A5E63] mb-6">The interactive owner email feature is currently turned off.</p>
          <button 
            onClick={() => setFeatureFlag(true)}
            className="px-6 py-3 bg-[#121519] text-white rounded-full font-bold"
          >
            Enable Feature
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100vh] bg-[#E6E0D3] text-[#121519] font-sans flex flex-col items-center" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      
      {/* Dev toolbar for feature flag */}
      <div className="fixed top-0 left-0 w-full bg-black text-white py-2 px-4 text-xs font-mono flex justify-between z-50">
        <span>Owner Interactive Email Sandbox</span>
        <button onClick={() => setFeatureFlag(false)} className="underline hover:text-gray-300">Disable Feature Flag</button>
      </div>

      <div className="w-full max-w-[390px] mt-12 mb-12 flex flex-col gap-3.5 bg-[#E6E0D3]">
        <div className="text-[13px] text-[#3A3E44] flex justify-between px-5">
          <span>Inbox</span>
          <span>9:05 am</span>
        </div>

        <div className="bg-white rounded-[18px] overflow-hidden flex flex-col shadow-md mx-4">
          <div className="bg-[#121519] text-[#F2EEE5] py-4 px-5 flex flex-col gap-1.5">
            <div className="text-xs font-bold tracking-[1.4px] uppercase text-[#B9B5AC]">
              NSDE Delivery &middot; to [SAI officer], IT Division
            </div>
            <div className="font-black text-[36px] leading-[0.98] uppercase mt-1" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {headline}
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4.5">
            <div className="text-[15px] leading-[1.5] text-[#3A3E44] mb-1">
              The Identity Platform team is waiting on these. Each takes under a minute. No login needed: the buttons are signed for you and expire in 7 days.
            </div>

            {/* Item 1 */}
            <div className="border-2 border-[#121519] rounded-[14px] p-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-extrabold tracking-[1.2px] uppercase text-[#A8411F]">Waiting 40 days</span>
                <span className="text-xs text-[#5A5E63]">blocks 1 workstream</span>
              </div>
              <div className="text-[17px] font-bold leading-[1.3]">
                Who approves a role change, such as athlete to coach?
              </div>
              {!one && (
                <div className="flex flex-col gap-2 mt-1">
                  {options.map(o => (
                    <button 
                      key={o}
                      onClick={() => setOne(o)}
                      className="min-h-[46px] rounded-full border-2 border-[#121519] bg-white text-[#121519] text-[15px] font-bold text-left px-4 hover:bg-[#F2EEE5]"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
              {!!one && (
                <div className="bg-[#E3F0E9] rounded-xl p-3 text-[15px] leading-[1.45] text-[#134B33] mt-1">
                  <strong>Done: {one}.</strong> Recorded in the Decision Log. Mansi's team can pick the work up today.
                </div>
              )}
            </div>

            {/* Item 2 */}
            <div className="border-2 border-[#121519] rounded-[14px] p-4 flex flex-col gap-2.5 mt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-extrabold tracking-[1.2px] uppercase text-[#A8411F]">Waiting 11 days</span>
                <span className="text-xs text-[#5A5E63]">requested by mail on 10 Sep</span>
              </div>
              <div className="text-[17px] font-bold leading-[1.3]">
                Share the list of registered athletes to map with government agencies
              </div>
              {two === 0 && (
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => setTwo(1)}
                    className="flex-grow min-h-[46px] rounded-full bg-[#121519] text-[#F2EEE5] text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-[#A8411F] focus:ring-offset-2 focus:ring-offset-[#E6E0D3]"
                  >
                    Upload the list
                  </button>
                  <button 
                    onClick={() => setTwo(2)}
                    className="flex-grow min-h-[46px] rounded-full border-2 border-[#121519] bg-white text-[#121519] text-[15px] font-bold hover:bg-[#F2EEE5] focus:outline-none focus:ring-2 focus:ring-[#A8411F]"
                  >
                    Pass to a colleague
                  </button>
                </div>
              )}
              {two !== 0 && (
                <div className="bg-[#E3F0E9] rounded-xl p-3 text-[15px] leading-[1.45] text-[#134B33] mt-1">
                  {two === 1 ? "Received. The team has been told and the item is off your list." : "Passed on. It now waits on your colleague, and you will not be reminded again."}
                </div>
              )}
            </div>

            <div className="text-[13px] leading-[1.5] text-[#5A5E63] mt-2">
              You receive one message like this a day at most, and only when something waits on you. <Link href="/leadership" className="text-[#A8411F] hover:underline">Open the Track</Link> if you want the full picture.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
