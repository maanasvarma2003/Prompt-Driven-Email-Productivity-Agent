'use client';

import { useChat } from '@ai-sdk/react';
import { Send, Bot, Sparkles, Edit, User, Paperclip, AlertCircle, Volume2, StopCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AgentChatProps {
  contextEmailId: string | null;
}

export function AgentChat({ contextEmailId }: AgentChatProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
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
                   {m.content}
                 </ReactMarkdown>
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
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <button type="button" className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            className="flex-1 bg-transparent text-sm max-h-32 min-h-[44px] py-3 focus:outline-none resize-none text-slate-800 placeholder:text-slate-400"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
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
