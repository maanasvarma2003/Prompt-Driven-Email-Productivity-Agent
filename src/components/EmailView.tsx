'use client';

import { Email } from "@/types";
import { Loader2, Zap, Calendar, Flag, PenTool, Mail, Mic, MessageSquare, BrainCircuit, ChevronLeft, Send, CheckCircle, Paperclip, X, Users, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { mutate } from "swr";
import TrustLedger from "./TrustLedger";
import { GenerativeWidget } from "./GenerativeWidgets";

interface EmailViewProps {
  email: Email | null;
  onProcess: (id: string) => Promise<void>;
  isProcessing: boolean;
  onBack?: () => void; // New prop for mobile back navigation
  className?: string; // Add className for visibility toggling
}

export function EmailView({ email, onProcess, isProcessing, onBack, className = '' }: EmailViewProps) {
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSwarmDrafting, setIsSwarmDrafting] = useState(false); // New state for Swarm
  const [generatedDraft, setGeneratedDraft] = useState<{ id: string; subject: string; body: string; swarmAnalysis?: string } | null>(null);
  const [smartChips, setSmartChips] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset local state when email changes
  useEffect(() => {
    setGeneratedDraft(null);
    setIsDrafting(false);
    setSmartChips([]);
    setSendSuccess(false);
    setAttachments([]);
    if (email) {
       // Fetch Smart Chips
       fetch('/api/chips', { method: 'POST', body: JSON.stringify({ emailId: email.id }) })
         .then(res => res.json())
         .then(chips => setSmartChips(chips));
    }
  }, [email?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDraft = async (instruction?: string, mode: 'standard' | 'swarm' = 'standard') => {
    if (!email) return;
    
    if (mode === 'swarm') setIsSwarmDrafting(true);
    else setIsDrafting(true);
    
    setGeneratedDraft(null); // Clear previous draft
    setSendSuccess(false);
    
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email.id, instruction, mode }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate draft");
      }

      if (data.subject && data.body) {
        setGeneratedDraft(data);
        mutate('/api/drafts'); // Refresh drafts list immediately
      } else {
        throw new Error("Invalid draft response from server");
      }
    } catch (e: any) {
      console.error("Draft Error:", e);
      alert(`Error generating draft: ${e.message}`);
    } finally {
      setIsDrafting(false);
      setIsSwarmDrafting(false);
    }
  };

  const handleSend = async () => {
    if (!generatedDraft?.id) return;
    
    setIsSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            draftId: generatedDraft.id,
            attachments: attachments.map(f => ({ name: f.name, size: f.size, type: f.type })) 
        }),
      });

      if (!res.ok) throw new Error("Failed to send email");

      // Success
      setSendSuccess(true);
      mutate('/api/sent'); // Refresh sent list
      mutate('/api/drafts'); // Refresh drafts list (it should be removed)
      
      // Hide the draft card after a delay or keep success message
      setTimeout(() => {
          setGeneratedDraft(null);
          setSendSuccess(false);
      }, 3000);

    } catch (e: any) {
      console.error("Send Error:", e);
      alert(`Error sending email: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice commands are only supported in Chrome/Edge/Safari. Please ensure you are using a supported browser.");
      return;
    }
    
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log("🎤 Listening...");
        setIsListening(true);
      };
      
      recognition.onend = () => {
        console.log("🎤 Stopped listening.");
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Voice Error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
           alert("Microphone access blocked. Please allow microphone permissions in your browser settings.");
        }
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("🗣️ Raw Transcript:", transcript);
        
        setIsListening(false); // Stop immediately

        const cleanTranscript = transcript.toLowerCase().trim();
        
        // 1. Empty Intent Detection: Commands that mean "Just Draft"
        // If the user says ONLY these phrases (fuzzy match), we send NO instruction (auto-mode)
        const emptyIntents = [
            'draft a reply', 'draft reply', 'reply to this email', 'reply to email', 
            'write a reply', 'write reply', 'reply', 'draft', 'respond'
        ];

        // Check if transcript is basically just one of these commands
        const isEmptyIntent = emptyIntents.some(intent => 
            cleanTranscript === intent || 
            cleanTranscript === intent + '.' ||
            cleanTranscript === intent + ' please'
        );

        if (isEmptyIntent) {
            console.log("🤖 Detected Empty Intent -> Auto Draft");
            handleDraft(undefined);
            return;
        }

        // 2. Command Parsing: Strip prefix "Reply saying..."
        // If it's not empty, we try to strip the command part
        const commandPrefixes = [
            'draft a reply saying', 'reply saying', 'write a reply saying', 
            'reply that', 'tell him that', 'tell her that', 'tell them that', 
            'say that', 'respond saying'
        ];
        
        let finalInstruction = transcript;
        let matchedPrefix = false;

        for (const prefix of commandPrefixes) {
            if (cleanTranscript.startsWith(prefix)) {
                // Slice off the prefix from the ORIGINAL transcript (to preserve case of the message)
                // +1 for potential space
                finalInstruction = transcript.slice(prefix.length).trim();
                matchedPrefix = true;
                break;
            }
        }

        // If we didn't match a specific "saying" prefix but it contains "draft" or "reply",
        // we fall back to the old "strip keywords" method but be more careful.
        if (!matchedPrefix && (cleanTranscript.includes('draft') || cleanTranscript.includes('reply'))) {
             // If it's a complex sentence like "I want you to draft a reply about X",
             // we might just pass it as is, OR try to clean it.
             // User complaint: "replies are like draft a reply".
             // So we MUST strip the command words if they appear at start.
             
             const fallbackRegex = /^(draft a reply|reply to this email|reply|write a response|draft)( to this email)?( saying| that)?/i;
             finalInstruction = transcript.replace(fallbackRegex, '').trim();
        }

        // Final Check: If after cleaning we have very little text, ignore or treat as empty
        if (finalInstruction.length < 3) {
             handleDraft(undefined);
        } else {
             handleDraft(finalInstruction);
        }
      };
      
      recognition.start();
    } catch (e) {
      console.error("Speech Recognition Error:", e);
      setIsListening(false);
    }
  };

  if (!email) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 ${className}`}>
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Zap className="w-10 h-10 text-slate-300" />
        </div>
        <p className="font-medium text-lg text-slate-500">Select an email to get started</p>
        <p className="text-sm text-slate-400 mt-2">AI-powered analysis awaits</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full bg-white overflow-hidden relative ${className}`}>
      {/* Sticky Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
             {/* Back Button for Mobile */}
             <div className="flex items-center gap-2 mb-2">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-1.5 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-snug truncate" title={email.subject}>{email.subject}</h1>
             </div>
             
             {/* Smart Chips */}
             <div className="flex gap-2 flex-wrap">
               {smartChips.map((chip, i) => (
                 <button 
                   key={i}
                   onClick={() => handleDraft(`Reply saying: ${chip}`)}
                   className="text-[10px] px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all flex items-center gap-1 font-medium"
                 >
                   <MessageSquare className="w-3 h-3" /> {chip}
                 </button>
               ))}
             </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
            {/* Voice Command Button */}
            <button
               onClick={handleVoiceCommand}
               className={`shrink-0 p-2 rounded-lg border transition-all ${
                 isListening ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse ring-2 ring-rose-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
               }`}
               title="Voice Command"
            >
               <Mic className="w-4 h-4" />
            </button>

             {/* Draft Button */}
             <div className="flex gap-1">
                <button
                onClick={() => handleDraft(undefined, 'standard')}
                disabled={isDrafting || isSwarmDrafting}
                className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg rounded-r-none disabled:opacity-50 transition-all text-xs font-semibold shadow-sm"
                >
                {isDrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenTool className="w-3.5 h-3.5" />}
                Draft
                </button>
                <button
                    onClick={() => handleDraft(undefined, 'swarm')}
                    disabled={isDrafting || isSwarmDrafting}
                    className="shrink-0 px-2 py-2 bg-indigo-50 border border-l-0 border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-lg rounded-l-none transition-all"
                    title="Deep Research & Draft (Swarm Mode)"
                >
                    {isSwarmDrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                </button>
             </div>

            {/* Process Button */}
             {!email.analysis ? (
               <button
                 onClick={() => {
                    console.log("Process button clicked");
                    onProcess(email.id);
                 }}
                 disabled={isProcessing}
                 className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-slate-900/20 hover:shadow-lg text-xs font-bold tracking-wide uppercase active:scale-95"
               >
                 {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                 Process
               </button>
             ) : (
               <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold shadow-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Processed
               </div>
             )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-50 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                {email.sender[0].toUpperCase()}
            </div>
            <span className="font-semibold text-slate-900">{email.sender}</span>
          </div>
          <div className="w-px h-3 bg-slate-200"></div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(email.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 space-y-8">
        
        {/* Generated Draft Card */}
        {generatedDraft && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 md:p-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
             
             {/* Swarm Insight (If Available) */}
             {generatedDraft.swarmAnalysis && (
                <div className="mb-4 p-3 bg-indigo-100/50 rounded-xl border border-indigo-200/50 text-xs text-indigo-900 font-medium">
                    <div className="flex items-center gap-2 mb-1 text-indigo-700 uppercase tracking-wider font-bold">
                        <Users className="w-3 h-3" /> Swarm Intelligence Active
                    </div>
                    <div className="opacity-80 whitespace-pre-wrap">{generatedDraft.swarmAnalysis}</div>
                </div>
             )}

             <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                 <Mail className="w-4 h-4 text-indigo-500" />
                 {sendSuccess ? "Reply Sent Successfully" : "Auto-Generated Reply"}
               </h3>
               <div className="flex gap-2">
                  <button className="text-xs bg-white px-3 py-1 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
                    Copy Text
                  </button>
               </div>
             </div>
             
             {sendSuccess ? (
                <div className="bg-white rounded-xl border border-green-200 p-8 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Email Sent!</h3>
                    <p className="text-sm text-slate-500">Your reply has been delivered and archived.</p>
                </div>
             ) : (
                <>
                    <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
                        <div className="mb-2 text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
                        Subject: {generatedDraft.subject}
                        </div>
                        <div className="whitespace-pre-wrap text-slate-600 text-sm leading-relaxed font-mono">
                        {generatedDraft.body}
                        </div>

                        {/* Attachments Area */}
                        <div className="mt-4 border-t border-slate-100 pt-3">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg text-xs font-medium text-slate-700">
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trust Ledger Integration */}
                        <TrustLedger />
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                            >
                                <Paperclip className="w-4 h-4" />
                                Attach Files
                            </button>
                        </div>
                        <button 
                            onClick={handleSend}
                            disabled={isSending}
                            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isSending ? 'Sending...' : 'Send Now'}
                        </button>
                    </div>
                </>
             )}
          </div>
        )}

        {/* Analysis Card */}
        {(email.category || email.actionItems?.length || email.analysis) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
               <Zap className="w-4 h-4 text-blue-500" />
               AI Insights
             </h3>
             
             {/* Summary Section */}
             {email.analysis && (
                <div className="mb-6 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold text-blue-700 block mb-1">Summary</span>
                  {email.analysis}
                </div>
             )}

             {/* Sender Profile (Neuro-Linguistic) */}
             {email.senderProfile && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" /> Psych Profile
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-[10px] text-purple-400 uppercase font-bold">Archetype</div>
                            <div className="font-medium text-purple-900">{email.senderProfile.archetype}</div>
                        </div>
                         <div>
                            <div className="text-[10px] text-purple-400 uppercase font-bold">Strategy</div>
                            <div className="text-purple-800 leading-snug">{email.senderProfile.strategy}</div>
                        </div>
                    </div>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {email.category && (
                  <div>
                    <span className="text-sm text-slate-500 block mb-1">Category</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${
                       email.category === 'Important' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                       email.category === 'To-Do' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                       'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {email.category}
                    </span>
                  </div>
                )}
                
                {email.actionItems && email.actionItems.length > 0 && (
                   <div className="col-span-1 md:col-span-2">
                      <span className="text-sm text-slate-500 block mb-2">Action Items</span>
                      <div className="space-y-2">
                        {email.actionItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                              item.priority === 'High' ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                            }`}>
                               {item.priority === 'High' && <div className="w-2 h-2 bg-rose-500 rounded-full" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{item.task}</p>
                              {item.deadline && (
                                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                  <Flag className="w-3 h-3" /> Due: {item.deadline}
                                </p>
                              )}
                            </div>
                            {item.priority && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                item.priority === 'High' ? 'text-rose-600 bg-rose-50' :
                                item.priority === 'Medium' ? 'text-amber-600 bg-amber-50' :
                                'text-blue-600 bg-blue-50'
                              }`}>
                                {item.priority}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Email Body */}
        <div className="prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap text-slate-700 leading-7 text-base font-normal">
            {email.body}
          </div>
        </div>

        {/* Generative UI Widgets (Demo based on keywords) */}
        {email.body.toLowerCase().includes('flight') && <GenerativeWidget type="flight" data={{}} />}
        {email.body.toLowerCase().includes('contract') && <GenerativeWidget type="contract" data={{}} />}
        {email.body.toLowerCase().includes('schedule') && <GenerativeWidget type="calendar" data={{}} />}

      </div>
    </div>
  );
}
