"use client";

import { useState } from 'react';

type Conflict = {
  dbId: string;
  projectTitle: string;
  workstreamTitle: string;
  taskTitle: string;
  differences: Array<{ field: string; app: any; excel: any }>;
  excelData: any;
  selectedFields?: string[];
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [newTasks, setNewTasks] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setParsed(data.parsedData);
        setNewTasks(data.newTasks);
        
        // Initialize all conflicts to keep app value (empty selectedFields)
        const initConflicts = (data.conflicts || []).map((c: Conflict) => ({
          ...c,
          selectedFields: []
        }));
        setConflicts(initConflicts);
      } else {
        alert("Error parsing: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to upload");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleField = (conflictIdx: number, field: string) => {
    setConflicts(prev => {
      const next = [...prev];
      const conf = next[conflictIdx];
      const fields = conf.selectedFields || [];
      if (fields.includes(field)) {
        conf.selectedFields = fields.filter(f => f !== field);
      } else {
        conf.selectedFields = [...fields, field];
      }
      return next;
    });
  };

  const handleBulkApp = () => {
    setConflicts(prev => prev.map(c => ({ ...c, selectedFields: [] })));
  };

  const handleBulkExcel = () => {
    setConflicts(prev => prev.map(c => ({ 
      ...c, 
      selectedFields: c.differences.map(d => d.field) 
    })));
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const payload = {
        fileName: file?.name,
        newTasks,
        resolvedConflicts: conflicts.filter(c => c.selectedFields && c.selectedFields.length > 0)
      };
      const res = await fetch('/api/import/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Import successful!");
        setParsed(null);
        setNewTasks([]);
        setConflicts([]);
        setFile(null);
      } else {
        alert("Error applying: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to apply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">Excel Import Review</h1>
      
      {!parsed && (
        <div className="mb-8 p-6 bg-gray-50 border rounded-lg">
          <input type="file" accept=".xlsx" onChange={handleFileChange} className="block mb-4" />
          <button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Parsing...' : 'Upload & Compare'}
          </button>
        </div>
      )}

      {parsed && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Ready to import: {newTasks.length} new tasks, {conflicts.length} conflicting tasks.
            </h2>
            <div className="space-x-4">
              <button onClick={handleApply} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
                {loading ? 'Applying...' : 'Apply Changes'}
              </button>
              <button onClick={() => setParsed(null)} className="px-4 py-2 bg-gray-200 rounded">
                Cancel
              </button>
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Conflicts</h3>
                <div className="space-x-2">
                  <button onClick={handleBulkApp} className="px-3 py-1 text-sm bg-gray-200 rounded">Keep all App values</button>
                  <button onClick={handleBulkExcel} className="px-3 py-1 text-sm bg-gray-200 rounded">Take all Excel values</button>
                </div>
              </div>
              
              <div className="space-y-4">
                {conflicts.map((conf, idx) => (
                  <div key={conf.dbId} className="border p-4 rounded-lg bg-white shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">
                      {conf.projectTitle} &rsaquo; {conf.workstreamTitle}
                    </p>
                    <p className="font-semibold mb-4">{conf.taskTitle}</p>
                    
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2">Field</th>
                          <th className="pb-2">App Value</th>
                          <th className="pb-2">Excel Value</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conf.differences.map(diff => {
                          const isExcel = conf.selectedFields?.includes(diff.field);
                          return (
                            <tr key={diff.field} className="border-b last:border-0">
                              <td className="py-2 font-mono text-gray-700">{diff.field}</td>
                              <td className={`py-2 ${!isExcel ? 'font-bold text-blue-600' : 'text-gray-400 line-through'}`}>
                                {String(diff.app ?? 'empty')}
                              </td>
                              <td className={`py-2 ${isExcel ? 'font-bold text-blue-600' : 'text-gray-400 line-through'}`}>
                                {String(diff.excel ?? 'empty')}
                              </td>
                              <td className="py-2 text-right">
                                <button 
                                  onClick={() => handleToggleField(idx, diff.field)}
                                  className="px-2 py-1 bg-gray-100 border rounded hover:bg-gray-200"
                                >
                                  Swap
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">New Tasks to Add</h3>
              <ul className="space-y-2">
                {newTasks.map((t, i) => (
                  <li key={i} className="p-3 border rounded text-sm bg-gray-50">
                    <span className="text-gray-500">{t.projectTitle} &rsaquo; {t.workstreamTitle} &rsaquo;</span> <strong>{t.taskTitle}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
