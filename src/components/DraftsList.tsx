'use client';

import { Draft } from "@/types";
import { Edit, Trash2, Send, Save, X, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { mutate } from "swr";

interface DraftsListProps {
  drafts: Draft[];
}

export function DraftsList({ drafts }: DraftsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ subject: string; body: string }>({ subject: '', body: '' });
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const startEdit = (draft: Draft) => {
    setEditingId(draft.id);
    setEditForm({ subject: draft.subject, body: draft.body });
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
                  <textarea
                    className="w-full h-48 bg-transparent outline-none resize-none text-sm font-mono text-slate-700 leading-relaxed p-2"
                    value={editForm.body}
                    onChange={(e) => setEditForm({...editForm, body: e.target.value})}
                  />
                ) : (
                  <div className="text-sm text-slate-600 font-mono whitespace-pre-wrap break-words">
                    {draft.body}
                  </div>
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
