'use client';

import { Draft, Attachment } from "@/types";
import { Edit, Trash2, Send, Save, X, Loader2, CheckCircle, Paperclip, File } from "lucide-react";
import { useState, useRef } from "react";
import { mutate } from "swr";

interface DraftsListProps {
  drafts: Draft[];
}

export function DraftsList({ drafts }: DraftsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ subject: string; body: string; attachments: Attachment[] }>({ subject: '', body: '', attachments: [] });
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  
  // Ref for file input (one shared ref is enough if we manage focus, but we need to know which draft triggered it)
  // Actually, for the "Attach" button in View mode, we need a way to know which draft.
  // We can use a hidden input per draft OR a single hidden input and track "attachingId".
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (draft: Draft) => {
    setEditingId(draft.id);
    setEditForm({ subject: draft.subject, body: draft.body, attachments: draft.attachments || [] });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
       await fetch(`/api/drafts/${id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(editForm)
       });
       mutate('/api/drafts');
       setEditingId(null);
       showToast('Draft updated successfully', 'success');
    } catch (e) {
       showToast('Failed to save draft', 'error');
    }
  };

  const triggerAttach = (id: string) => {
      setAttachingId(id);
      setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const newAttachments: Attachment[] = Array.from(e.target.files).map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
      }));

      // If we are Editing, add to editForm
      if (editingId) {
          setEditForm(prev => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }));
      } 
      // If we are just attaching to a draft in View mode
      else if (attachingId) {
          // Fetch current draft to get existing attachments?
          const draft = drafts.find(d => d.id === attachingId);
          if (draft) {
             const updatedAttachments = [...(draft.attachments || []), ...newAttachments];
             try {
                await fetch(`/api/drafts/${attachingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...draft, attachments: updatedAttachments })
                });
                mutate('/api/drafts');
                showToast('Files attached', 'success');
             } catch (e) {
                showToast('Failed to attach files', 'error');
             }
          }
          setAttachingId(null);
      }
      
      // Reset input
      e.target.value = '';
  };

  const removeAttachment = (index: number) => {
      setEditForm(prev => ({
          ...prev,
          attachments: prev.attachments.filter((_, i) => i !== index)
      }));
  };

  const deleteDraft = async (id: string) => {
    if (!confirm('Are you sure you want to discard this draft?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      mutate('/api/drafts');
      showToast('Draft deleted', 'success');
    } catch (e) {
      showToast('Failed to delete draft', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const sendEmail = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: id })
      });
      if (!res.ok) throw new Error();
      mutate('/api/drafts');
      showToast('Email sent successfully!', 'success');
    } catch (e) {
      showToast('Failed to send email', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
     setToast({ msg, type });
     setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-4 h-full overflow-y-auto bg-slate-50/50 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right-10 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Drafts</h1>
        <p className="text-slate-500">Review, edit, and send generated replies</p>
      </div>

      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Edit className="w-12 h-12 mb-4 opacity-20" />
          <p>No drafts yet. Generate one from the Inbox.</p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-full">
          {drafts.map((draft) => (
            <div key={draft.id} className={`bg-white p-5 rounded-2xl border transition-all shadow-sm ${editingId === draft.id ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200 hover:shadow-md'}`}>
              
              {/* Header & Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex-1 min-w-0 w-full">
                  {editingId === draft.id ? (
                    <input 
                      className="w-full font-bold text-slate-800 border-b border-indigo-200 focus:outline-none focus:border-indigo-500 bg-transparent pb-1"
                      value={editForm.subject}
                      onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                    />
                  ) : (
                    <>
                       <h3 className="font-bold text-slate-800 mb-1 truncate" title={draft.subject}>{draft.subject}</h3>
                       <p className="text-xs text-slate-400">Created {new Date(draft.createdAt).toLocaleString()}</p>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full md:w-auto shrink-0">
                   {editingId === draft.id ? (
                     <>
                       <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                         <X className="w-4 h-4" />
                       </button>
                       <button onClick={() => saveEdit(draft.id)} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                         <Save className="w-4 h-4" />
                       </button>
                     </>
                   ) : (
                     <>
                       <button 
                         onClick={() => triggerAttach(draft.id)}
                         disabled={!!sendingId}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                         title="Attach Files"
                       >
                         <Paperclip className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => startEdit(draft)}
                         disabled={!!sendingId}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                         title="Edit"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => deleteDraft(draft.id)}
                         disabled={!!sendingId || deletingId === draft.id}
                         className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                         title="Delete"
                       >
                         {deletingId === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                       </button>
                       <button 
                         onClick={() => sendEmail(draft.id)}
                         disabled={!!sendingId || deletingId === draft.id}
                         className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50"
                       >
                         {sendingId === draft.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                         {sendingId === draft.id ? 'Sending...' : 'Send'}
                       </button>
                     </>
                   )}
                </div>
              </div>
              
              {/* Body Content */}
              <div className={`p-4 rounded-xl border ${editingId === draft.id ? 'bg-white border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                {editingId === draft.id ? (
                  <>
                    <textarea
                        className="w-full h-48 bg-transparent outline-none resize-none text-sm font-mono text-slate-700 leading-relaxed p-2"
                        value={editForm.body}
                        onChange={(e) => setEditForm({...editForm, body: e.target.value})}
                    />
                    
                    {/* Editing Attachments Area */}
                    <div className="mt-3 pt-3 border-t border-indigo-50">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {editForm.attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-lg text-xs font-medium text-indigo-700 border border-indigo-100">
                                    <File className="w-3 h-3 text-indigo-400" />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => removeAttachment(i)} className="text-indigo-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                // Since we are editing, we don't need to set attachingId, just click ref
                                // BUT handleFileChange checks attachingId vs editingId.
                                // We are in editingId mode.
                                fileInputRef.current?.click();
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors"
                        >
                            <Paperclip className="w-3.5 h-3.5" />
                            Attach Files
                        </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-slate-600 font-mono whitespace-pre-wrap break-words">
                        {draft.body}
                    </div>
                    {/* View Attachments */}
                    {draft.attachments && draft.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                             {draft.attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 text-xs text-slate-500">
                                    <File className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                </div>
                             ))}
                        </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Suggestions */}
              {draft.followUpSuggestions && draft.followUpSuggestions.length > 0 && !editingId && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {draft.followUpSuggestions.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
