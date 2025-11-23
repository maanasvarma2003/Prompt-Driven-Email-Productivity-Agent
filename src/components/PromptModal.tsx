'use client';

import { PromptConfig } from "@/types";
import { useState, useEffect } from "react";
import { X, Save, Brain, Sparkles, ChevronRight, Loader2 } from "lucide-react";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromptModal({ isOpen, onClose }: PromptModalProps) {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetch('/api/prompts')
        .then(res => res.json())
        .then(data => {
          setPrompts(data);
          setLoading(false);
          if (data.length > 0) setActiveTab(data[0].id);
        });
    }
  }, [isOpen]);

  const handleSave = async (id: string, template: string) => {
    setSavingId(id);
    await fetch('/api/prompts', {
      method: 'POST',
      body: JSON.stringify({ id, template }),
    });
    setTimeout(() => setSavingId(null), 500); // Fake delay for UX
  };

  if (!isOpen) return null;

  const activePrompt = prompts.find(p => p.id === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Agent Brain</h2>
              <p className="text-sm text-slate-500">Configure how the AI behaves</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
           {/* Sidebar Tabs */}
           <div className="w-64 bg-slate-50 border-r border-slate-100 flex flex-col p-4 gap-2 overflow-y-auto">
             {loading ? (
               <div className="space-y-3">
                 {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-200 rounded-lg animate-pulse" />)}
               </div>
             ) : (
               prompts.map(prompt => (
                 <button
                   key={prompt.id}
                   onClick={() => setActiveTab(prompt.id)}
                   className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                     activeTab === prompt.id 
                       ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' 
                       : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                   }`}
                 >
                   {prompt.name}
                   {activeTab === prompt.id && <ChevronRight className="w-4 h-4 text-purple-500" />}
                 </button>
               ))
             )}
           </div>

           {/* Editor Area */}
           <div className="flex-1 p-8 bg-white overflow-y-auto">
             {activePrompt ? (
               <div className="h-full flex flex-col">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="text-lg font-bold text-slate-900 mb-1">{activePrompt.name}</h3>
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600 uppercase tracking-wide">
                         {activePrompt.type}
                       </span>
                       <span className="text-xs text-slate-400">System Prompt</span>
                     </div>
                   </div>
                   
                   <button 
                     onClick={() => handleSave(activePrompt.id, activePrompt.template)}
                     disabled={savingId === activePrompt.id}
                     className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-70 transition-all text-sm font-medium shadow-sm active:scale-95"
                   >
                     {savingId === activePrompt.id ? (
                       <>
                         <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                       </>
                     ) : (
                       <>
                         <Save className="w-4 h-4" /> Save Changes
                       </>
                     )}
                   </button>
                 </div>

                 <div className="flex-1 relative group">
                   <div className="absolute inset-0 pointer-events-none border border-slate-200 rounded-xl group-focus-within:border-purple-500 group-focus-within:ring-4 group-focus-within:ring-purple-500/10 transition-all"></div>
                   <textarea
                     className="w-full h-full p-6 text-sm font-mono bg-slate-50/50 rounded-xl outline-none resize-none text-slate-800 leading-relaxed"
                     value={activePrompt.template}
                     onChange={(e) => {
                       const newPrompts = prompts.map(p => 
                         p.id === activePrompt.id ? { ...p, template: e.target.value } : p
                       );
                       setPrompts(newPrompts);
                     }}
                     spellCheck={false}
                   />
                 </div>
                 
                 <div className="mt-4 flex items-start gap-2 text-slate-400 text-xs bg-slate-50 p-3 rounded-lg">
                   <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                   <p>
                     Tip: Use clear, step-by-step instructions. The agent uses this prompt to understand its role and constraints.
                   </p>
                 </div>
               </div>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400">
                 Select a prompt to edit
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
