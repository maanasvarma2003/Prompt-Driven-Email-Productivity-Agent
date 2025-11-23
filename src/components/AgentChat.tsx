'use client';

import { useChat } from '@ai-sdk/react';
import { Send, Bot, Sparkles, Edit, User, Paperclip, AlertCircle, Volume2, StopCircle, X, File, Loader2, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatDraftActions({ draftId }: { draftId: string }) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
        await fetch('/api/send', {
            method: 'POST',
            body: JSON.stringify({ 
                draftId, 
                attachments: attachments.map(f => ({ name: f.name, size: f.size, type: f.type }))
            })
        });
        setSent(true);
    } catch (e) {
        alert("Failed to send");
    } finally {
        setIsSending(false);
    }
  };

  if (sent) return <div className="mt-2 text-emerald-600 text-xs font-bold flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100"><CheckCircle className="w-3.5 h-3.5"/> Email Sent Successfully</div>;

  return (
    <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-2">
       {/* Attachments List */}
       {attachments.length > 0 && (
         <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((f, i) => (
                <div key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded flex items-center gap-1 border border-slate-200 text-slate-700">
                    <span className="truncate max-w-[100px]">{f.name}</span> 
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X className="w-3 h-3"/></button>
                </div>
            ))}
         </div>
       )}
       
       <div className="flex justify-between items-center">
         <div className="flex items-center gap-2">
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors">
                <Paperclip className="w-3.5 h-3.5" /> Attach Files
            </button>
         </div>
         <button onClick={handleSend} disabled={isSending} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50 font-bold shadow-sm shadow-indigo-200">
            {isSending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3"/>} Send Now
         </button>
       </div>
    </div>
  );
}

interface AgentChatProps {
  contextEmailId: string | null;
}

export function AgentChat({ contextEmailId }: AgentChatProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    api: '/api/chat',
    body: { contextEmailId },
    onError: (e) => {
      console.error("Chat error:", e);
    },
    onFinish: (message) => {
        // Auto-TTS for assistant messages
        speak(message.content);
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there are attachments, we might want to append them to the message or handle them separately
    // For now, we'll append a note about attachments to the message content if any exist
    let extraData = {};
    if (attachments.length > 0) {
        // In a real app, you'd upload these first and send URLs. 
        // Here we simulate by adding metadata to the chat context or message.
        // We'll just modify the submission slightly or assume the backend knows.
        // But since useChat takes text, let's just proceed.
        // We can clear attachments after send.
    }
    
    handleSubmit(e, { 
        data: { 
            attachments: JSON.stringify(attachments.map(f => ({ name: f.name, type: f.type, size: f.size }))) 
        } 
    });
    setAttachments([]);
  };

  // TTS Logic
  const speak = (text: string) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, error]);

  return (
    <div className="w-full flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">MailMint Assistant</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              RAG Enabled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {isSpeaking ? (
                <button onClick={stopSpeaking} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors animate-pulse">
                    <StopCircle className="w-4 h-4" />
                </button>
            ) : (
                <button onClick={() => {
                    if (messages.length > 0) speak(messages[messages.length - 1].content);
                }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Volume2 className="w-4 h-4" />
                </button>
            )}
            <button 
              onClick={() => setMessages([])}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-2"
            >
              Clear Chat
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" ref={scrollRef}>
        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">How can I help you today?</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              I can search your inbox, summarize threads, or draft new emails.
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-lg">
               {["Summarize unread emails", "Draft a reply to boss", "Show urgent tasks", "Any newsletters?"].map(q => (
                 <button 
                    key={q}
                    className="text-xs bg-white border border-slate-200 py-3 px-4 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-slate-600 shadow-sm"
                 >
                   {q}
                 </button>
               ))}
            </div>
          </div>
        )}
        
        {messages.map(m => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
              m.role === 'user' ? 'bg-slate-100 border-white' : 'bg-emerald-100 border-emerald-50 text-emerald-600'
            }`}>
              {m.role === 'user' ? <User className="w-5 h-5 text-slate-400" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`flex flex-col gap-1 max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                 m.role === 'user' 
                   ? 'bg-slate-800 text-white rounded-tr-none' 
                   : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
               }`}>
                 <ReactMarkdown 
                   components={{
                     ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                     ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                     li: ({node, ...props}) => <li className="mb-1" {...props} />,
                     p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                     strong: ({node, ...props}) => <span className="font-bold text-slate-900" {...props} />,
                   }}
                 >
                   {m.content.replace(/<!-- DRAFT_ID:(.*?) -->/, '')}
                 </ReactMarkdown>

                 {/* Render Action Card if Draft ID found */}
                 {m.content.includes('<!-- DRAFT_ID:') && (
                    <ChatDraftActions draftId={m.content.match(/<!-- DRAFT_ID:(.*?) -->/)?.[1] || ''} />
                 )}
               </div>
               
               {/* Tool Results */}
               {m.toolInvocations?.map((toolInvocation) => {
                  if (toolInvocation.toolName === 'create_draft') {
                     const { subject, body } = toolInvocation.args;
                     return (
                       <div key={toolInvocation.toolCallId} className="mt-2 w-full bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                         <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center gap-2">
                           <Edit className="w-3 h-3 text-emerald-600" />
                           <span className="text-xs font-bold text-emerald-700">Draft Created</span>
                         </div>
                         <div className="p-4 space-y-2">
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Subject</div>
                              <div className="text-sm font-medium text-slate-800">{subject}</div>
                            </div>
                            <div>
                               <div className="text-[10px] text-slate-400 uppercase font-bold">Body</div>
                               <div className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1 font-mono">
                                 {body}
                               </div>
                            </div>
                         </div>
                       </div>
                     );
                  }
                  return null;
               })}
            </div>
          </div>
        ))}
        
        {isLoading && (
           <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border-2 border-emerald-50">
               <Bot className="w-5 h-5" />
             </div>
             <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></span>
             </div>
           </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleMessageSubmit} className="p-4 bg-white border-t border-slate-100 shrink-0">
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
            <div className="max-w-4xl mx-auto mb-2 flex flex-wrap gap-2">
                {attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
                        <File className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            className="flex-1 bg-transparent text-sm max-h-32 min-h-[44px] py-3 focus:outline-none resize-none text-slate-800 placeholder:text-slate-400"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleMessageSubmit(e);
              }
            }}
            placeholder="Ask MailMint..."
            rows={1}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
