"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const fetchResults = async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      };
      fetchResults();
    } else {
      setResults([]);
    }
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#DDD9CE]">
        <div className="flex items-center px-4 border-b border-[#DDD9CE]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A5E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input 
            autoFocus
            type="text" 
            placeholder="Search projects, workstreams, or tasks..." 
            className="w-full py-4 px-3 outline-none text-[17px] font-sans"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={() => setOpen(false)} className="text-[#5A5E63] text-sm font-semibold px-2 py-1 bg-[#F2EEE5] rounded">ESC</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length > 2 && results.length === 0 && (
            <div className="p-8 text-center text-[#5A5E63]">No results found for "{query}"</div>
          )}
          {results.length > 0 && (
            <div className="flex flex-col p-2">
              {results.map((r, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    setOpen(false);
                    if (r.projectId) {
                      router.push(`/project/${r.projectId}`);
                    }
                  }}
                  className="flex flex-col text-left px-4 py-3 hover:bg-[#F2EEE5] rounded-xl transition-colors focus:outline-none focus:bg-[#E3F0E9]"
                >
                  <span className="font-bold text-[15px]">{r.title}</span>
                  <span className="text-[13px] text-[#5A5E63] flex gap-2">
                    <span className="uppercase text-[11px] font-extrabold tracking-wider">{r.type}</span>
                    &middot; {r.parentTitle || 'Top level'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
