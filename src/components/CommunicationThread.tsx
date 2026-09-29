"use client";

import { useState } from 'react';

export default function CommunicationThread({ itemId, people }: { itemId: string, people: any[] }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]); // Mock local state for thread
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const handleTextChange = (e: any) => {
    const val = e.target.value;
    setMessage(val);

    // Naive mention detection
    const match = val.match(/@(\w*)$/);
    if (match) {
      setShowMentions(true);
      setMentionFilter(match[1]);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (person: any) => {
    const newVal = message.replace(/@\w*$/, `@${person.name} `);
    setMessage(newVal);
    setShowMentions(false);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // In a real app, we'd POST to /api/notes
    const newMsg = {
      id: Date.now().toString(),
      text: message,
      author: { name: 'You (Current User)', role: 'TEAMMATE' },
      createdAt: new Date()
    };
    
    setMessages([...messages, newMsg]);
    setMessage('');
  };

  const filteredPeople = people.filter(p => p.name.toLowerCase().includes(mentionFilter.toLowerCase()));

  // Render text with bold mentions
  const renderMessageText = (text: string) => {
    const parts = text.split(/(@\w+\s\w+|@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <strong key={i} className="text-[#A8411F] bg-[#F2EEE5] px-1 rounded">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col gap-4 bg-white rounded-2xl p-6 border border-[#DDD9CE] shadow-sm">
      <div className="font-extrabold text-[20px] uppercase text-[#121519]" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
        Team Communication & Mentions
      </div>
      <p className="text-[#5A5E63] text-sm mb-2">Tag colleagues with @ to notify them instantly.</p>

      {/* Message List */}
      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-[#8A8E93] italic text-sm py-4">No comments yet. Start the conversation!</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-[#E3F0E9] flex-shrink-0 flex items-center justify-center text-[#134B33] font-bold text-xs uppercase">
                {msg.author.name.substring(0,2)}
              </div>
              <div className="flex flex-col bg-[#F9F8F6] rounded-xl rounded-tl-none p-3 border border-[#E2DCCF]">
                <div className="flex justify-between items-baseline gap-4 mb-1">
                  <span className="font-bold text-[13px]">{msg.author.name}</span>
                  <span className="text-[11px] text-[#8A8E93]">{msg.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="text-[14px] leading-[1.4] text-[#121519]">
                  {renderMessageText(msg.text)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="relative mt-2">
        {showMentions && (
          <div className="absolute bottom-[100%] mb-2 left-0 w-[240px] max-h-[200px] bg-white border border-[#DDD9CE] shadow-lg rounded-xl overflow-y-auto z-10 flex flex-col p-1">
            {filteredPeople.length > 0 ? filteredPeople.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleMentionSelect(p)}
                className="flex items-center gap-2 px-3 py-2 text-left hover:bg-[#F2EEE5] rounded-lg transition-colors focus:outline-none focus:bg-[#E3F0E9]"
              >
                <div className="w-6 h-6 rounded-full bg-[#E3F0E9] flex-shrink-0 flex items-center justify-center text-[#134B33] font-bold text-[10px] uppercase">
                  {p.name.substring(0,2)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[13px]">{p.name}</span>
                  <span className="text-[10px] text-[#5A5E63]">{p.role}</span>
                </div>
              </button>
            )) : (
              <div className="text-xs text-[#8A8E93] italic p-3">No matching team members</div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input 
            type="text"
            value={message}
            onChange={handleTextChange}
            placeholder="Type a message... use @ to tag someone"
            className="flex-grow min-h-[46px] rounded-full border border-[#DDD9CE] bg-[#F9F8F6] px-5 text-[14px] focus:outline-none focus:border-[#121519] focus:bg-white transition-colors"
          />
          <button 
            type="submit"
            disabled={!message.trim()}
            className={`min-h-[46px] px-6 rounded-full font-bold text-[14px] transition-colors ${message.trim() ? 'bg-[#121519] text-white hover:bg-black' : 'bg-[#E6E0D3] text-[#8A8E93] cursor-not-allowed'}`}
          >
            Post
          </button>
        </form>
      </div>

    </div>
  );
}
