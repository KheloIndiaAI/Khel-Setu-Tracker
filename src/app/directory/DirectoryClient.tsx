"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DirectoryClient({ people, meId }: { people: any[]; meId: string }) {
  const router = useRouter();
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    id: '', 
    name: '',
    team: '',
    experience: '', 
    skills: '', 
    education: '',
    qualifications: '',
    resumeUrl: '',
    birthday: '',
    birthdayVis: false,
    interests: '',
    interestsVis: false,
    workAnniv: '',
    workAnnivVis: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = () => {
    const me = people.find((p) => p.id === meId);
    if (me) {
      setEditData({
        id: me.id,
        name: me.name || '',
        team: me.team || '',
        experience: me.experience || '',
        skills: (me.skills || []).join(', '),
        education: me.education || '',
        qualifications: (me.qualifications || []).join(', '),
        resumeUrl: me.resumeUrl || '',
        birthday: me.birthday ? new Date(me.birthday).toISOString().split('T')[0] : '',
        birthdayVis: me.birthdayVis || false,
        interests: me.interests || '',
        interestsVis: me.interestsVis || false,
        workAnniv: me.workAnniv ? new Date(me.workAnniv).toISOString().split('T')[0] : '',
        workAnnivVis: me.workAnnivVis || false
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const skillsArray = editData.skills.split(',').map(s => s.trim()).filter(s => s);
      const qualArray = editData.qualifications.split(',').map(s => s.trim()).filter(s => s);
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editData.id,
          name: editData.name,
          team: editData.team,
          experience: editData.experience,
          skills: skillsArray,
          education: editData.education,
          qualifications: qualArray,
          resumeUrl: editData.resumeUrl,
          birthday: editData.birthday || null,
          birthdayVis: editData.birthdayVis,
          interests: editData.interests,
          interestsVis: editData.interestsVis,
          workAnniv: editData.workAnniv || null,
          workAnnivVis: editData.workAnnivVis
        })
      });
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-[100vh] bg-[#F9F8F6] text-[#121519] font-sans flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      
      {/* Header */}
      <div className="flex items-center gap-7 py-4 px-12 border-b border-[#DDD9CE] bg-[#F2EEE5]">
        <div className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#B5472A" strokeWidth="3">
            <path d="M4 12h18a8 8 0 0 1 0 16H4"></path>
            <path d="M4 6h18a14 14 0 0 1 0 28"></path>
          </svg>
          <div className="font-extrabold text-[26px] tracking-wide uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            KHEL SETU
          </div>
        </div>
        <div className="text-sm font-bold tracking-widest uppercase text-[#5A5E63] ml-4">
          People Directory
        </div>
        <div className="flex-grow"></div>
        <a href="/" className="text-sm font-bold hover:underline">Back to Hub</a>
      </div>

      <div className="px-12 py-12 flex flex-col gap-10">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <h1 className="font-black text-[48px] uppercase tracking-wide" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              The Team
            </h1>
            <p className="text-[#5A5E63] text-[15px]">Find experts across the organization.</p>
          </div>
          <button 
            onClick={handleEditClick}
            className="h-11 px-6 rounded-full bg-[#121519] text-white font-bold text-sm shadow-md hover:bg-black transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#121519]"
          >
            Edit My Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map(p => (
            <button 
              key={p.id}
              onClick={() => setSelectedPerson(p)}
              className="bg-white rounded-2xl p-5 border border-[#DDD9CE] shadow-sm hover:shadow-md hover:border-[#121519] transition-all text-left flex flex-col gap-3 focus:outline-none focus:ring-2 focus:ring-[#121519]"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-[18px]">{p.name}</span>
                  <span className="text-[13px] text-[#5A5E63] font-semibold">{p.role} &middot; {p.team || "No team"}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#E3F0E9] flex items-center justify-center font-bold text-[#134B33] text-lg uppercase">
                  {p.name.substring(0,2)}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {p.skills && p.skills.slice(0,4).map((skill: string) => (
                  <span key={skill} className="bg-[#F2EEE5] text-[#3A3E44] text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                    {skill}
                  </span>
                ))}
                {p.skills && p.skills.length > 4 && (
                  <span className="text-[11px] font-bold text-[#8A8E93] py-1">+{p.skills.length - 4} more</span>
                )}
                {(!p.skills || p.skills.length === 0) && (
                  <span className="text-[12px] italic text-[#8A8E93]">No skills listed</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Profile View */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 flex flex-col gap-6 relative">
            <button 
              onClick={() => setSelectedPerson(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#F2EEE5] flex items-center justify-center text-[#5A5E63] hover:bg-[#E2DCCF] transition-colors"
            >
              ✕
            </button>

            <div className="flex gap-5 items-center border-b border-[#DDD9CE] pb-6">
              <div className="w-20 h-20 rounded-full bg-[#E3F0E9] flex items-center justify-center font-bold text-[#134B33] text-3xl uppercase">
                {selectedPerson.name.substring(0,2)}
              </div>
              <div className="flex flex-col">
                <h2 className="font-extrabold text-[32px] uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {selectedPerson.name}
                </h2>
                <span className="text-[15px] font-semibold text-[#5A5E63]">{selectedPerson.role} &middot; {selectedPerson.team || "No team"}</span>
                <a href={`mailto:${selectedPerson.email}`} className="text-[14px] text-[#B5472A] hover:underline font-bold mt-1">{selectedPerson.email}</a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-extrabold tracking-[1.4px] uppercase text-[#A8411F]">Past Experience</span>
                  <p className="text-[15px] leading-[1.5] text-[#3A3E44] whitespace-pre-wrap">
                    {selectedPerson.experience || "No past experience provided."}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-extrabold tracking-[1.4px] uppercase text-[#A8411F]">Education</span>
                  <p className="text-[15px] leading-[1.5] text-[#3A3E44] whitespace-pre-wrap">
                    {selectedPerson.education || "No education details provided."}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-extrabold tracking-[1.4px] uppercase text-[#A8411F]">Qualifications</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPerson.qualifications?.map((q: string) => (
                      <span key={q} className="bg-[#EFECE3] border border-[#DDD9CE] text-[#121519] text-[13px] font-bold px-3 py-1.5 rounded-lg">
                        {q}
                      </span>
                    ))}
                    {(!selectedPerson.qualifications || selectedPerson.qualifications.length === 0) && (
                      <span className="text-[14px] italic text-[#8A8E93]">No qualifications listed.</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-extrabold tracking-[1.4px] uppercase text-[#A8411F]">Skill Set</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPerson.skills?.map((skill: string) => (
                      <span key={skill} className="bg-[#121519] text-[#F2EEE5] text-[13px] font-bold px-3 py-1.5 rounded-lg">
                        {skill}
                      </span>
                    ))}
                    {(!selectedPerson.skills || selectedPerson.skills.length === 0) && (
                      <span className="text-[14px] italic text-[#8A8E93]">No skills provided.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 pl-8 border-l border-[#DDD9CE]">
                
                {/* Current Assignments */}
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-extrabold tracking-[1.4px] uppercase text-[#A8411F]">Current Assignments</span>
                  <div className="flex flex-col gap-2">
                     {(!selectedPerson.teamItems || selectedPerson.teamItems.length === 0) && (
                        <span className="text-[14px] italic text-[#8A8E93]">Not currently assigned to active tasks.</span>
                     )}
                     {selectedPerson.teamItems?.slice(0,5).map((item: any) => (
                        <div key={item.id} className="flex flex-col p-3 rounded-xl bg-[#F9F8F6] border border-[#E2DCCF]">
                           <span className="font-bold text-[14px]">{item.title}</span>
                           <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A5E63] mt-1">{item.type}</span>
                        </div>
                     ))}
                     {selectedPerson.teamItems?.length > 5 && (
                        <span className="text-[12px] font-bold text-[#5A5E63]">+{selectedPerson.teamItems.length - 5} more items</span>
                     )}
                  </div>
                </div>

                {/* Personal Info */}
                <div className="flex flex-col gap-4 mt-2">
                  {(selectedPerson.birthdayVis || selectedPerson.workAnnivVis || selectedPerson.interestsVis) && (
                    <span className="text-[12px] font-extrabold tracking-[1.4px] uppercase text-[#A8411F]">Personal</span>
                  )}
                  
                  {selectedPerson.birthdayVis && selectedPerson.birthday && (
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[11px] font-bold text-[#5A5E63] uppercase">Birthday</span>
                       <span className="text-[15px] font-medium">{new Date(selectedPerson.birthday).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
                     </div>
                  )}
                  {selectedPerson.workAnnivVis && selectedPerson.workAnniv && (
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[11px] font-bold text-[#5A5E63] uppercase">Work Anniversary</span>
                       <span className="text-[15px] font-medium">{new Date(selectedPerson.workAnniv).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}</span>
                     </div>
                  )}
                  {selectedPerson.interestsVis && selectedPerson.interests && (
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[11px] font-bold text-[#5A5E63] uppercase">Interests & Hobbies</span>
                       <span className="text-[15px] font-medium">{selectedPerson.interests}</span>
                     </div>
                  )}
                </div>

              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[#DDD9CE]">
              <a 
                href={selectedPerson.resumeUrl || '#'}
                target="_blank"
                className={`flex-grow h-12 rounded-full font-bold text-[15px] flex items-center justify-center transition-colors ${selectedPerson.resumeUrl ? 'bg-[#121519] text-white hover:bg-black' : 'bg-[#E6E0D3] text-[#8A8E93] pointer-events-none'}`}
              >
                {selectedPerson.resumeUrl ? "Download Resume" : "No Resume Uploaded"}
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl p-8 flex flex-col gap-6 relative text-left">
            <h2 className="font-extrabold text-[32px] uppercase border-b border-[#DDD9CE] pb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Edit My Profile
            </h2>
            
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-extrabold tracking-[1.6px] uppercase text-[#B5472A]">Core Information</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#5A5E63]">Full Name</label>
                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] font-semibold" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#5A5E63]">Team / Department</label>
                    <input type="text" value={editData.team} onChange={e => setEditData({...editData, team: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-[#DDD9CE]">
                <span className="text-[11px] font-extrabold tracking-[1.6px] uppercase text-[#B5472A]">Professional Details</span>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Education</label>
                  <input type="text" value={editData.education} onChange={e => setEditData({...editData, education: e.target.value})} placeholder="e.g. MBA from IIM Ahmedabad, B.Tech from IIT Delhi" className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Qualifications (comma separated)</label>
                  <input type="text" value={editData.qualifications} onChange={e => setEditData({...editData, qualifications: e.target.value})} placeholder="e.g. PMP, AWS Certified Solutions Architect" className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Skills (comma separated)</label>
                  <input type="text" value={editData.skills} onChange={e => setEditData({...editData, skills: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]" placeholder="e.g. Next.js, Prisma, UI/UX" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Past Experience</label>
                  <textarea value={editData.experience} onChange={e => setEditData({...editData, experience: e.target.value})} className="w-full h-20 px-4 py-3 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] resize-none" placeholder="Tell your team about your background..." />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#5A5E63]">Resume Link (URL)</label>
                  <input type="url" value={editData.resumeUrl} onChange={e => setEditData({...editData, resumeUrl: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]" placeholder="https://drive.google.com/..." />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-[#DDD9CE]">
                <span className="text-[11px] font-extrabold tracking-[1.6px] uppercase text-[#B5472A]">Personal & Voluntary</span>
                
                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#5A5E63]">Birthday</label>
                    <input type="date" value={editData.birthday} onChange={e => setEditData({...editData, birthday: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]" />
                  </div>
                  <label className="flex items-center gap-2 mt-6 cursor-pointer">
                    <input type="checkbox" checked={editData.birthdayVis} onChange={e => setEditData({...editData, birthdayVis: e.target.checked})} className="w-4 h-4" />
                    <span className="text-[13px] font-bold">Visible to team</span>
                  </label>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#5A5E63]">Work Anniversary</label>
                    <input type="date" value={editData.workAnniv} onChange={e => setEditData({...editData, workAnniv: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519]" />
                  </div>
                  <label className="flex items-center gap-2 mt-6 cursor-pointer">
                    <input type="checkbox" checked={editData.workAnnivVis} onChange={e => setEditData({...editData, workAnnivVis: e.target.checked})} className="w-4 h-4" />
                    <span className="text-[13px] font-bold">Visible to team</span>
                  </label>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#5A5E63]">Interests & Hobbies</label>
                    <textarea value={editData.interests} onChange={e => setEditData({...editData, interests: e.target.value})} className="w-full h-16 px-4 py-2 rounded-xl border border-[#DDD9CE] focus:outline-none focus:border-[#121519] resize-none" placeholder="e.g. Photography, Hiking..." />
                  </div>
                  <label className="flex items-center gap-2 mt-8 cursor-pointer">
                    <input type="checkbox" checked={editData.interestsVis} onChange={e => setEditData({...editData, interestsVis: e.target.checked})} className="w-4 h-4" />
                    <span className="text-[13px] font-bold">Visible to team</span>
                  </label>
                </div>

              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[#DDD9CE]">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-grow h-12 rounded-full font-bold text-[15px] border-2 border-[#121519] hover:bg-[#F2EEE5] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-grow h-12 rounded-full font-bold text-[15px] bg-[#121519] text-white hover:bg-black transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
