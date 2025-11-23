'use client';

import { useState, useEffect } from "react";
import useSWR, { SWRConfig, mutate } from "swr";
import { Inbox } from "@/components/Inbox";
import { EmailView } from "@/components/EmailView";
import { AgentChat } from "@/components/AgentChat";
import { PromptModal } from "@/components/PromptModal";
import { Dashboard } from "@/components/Dashboard";
import { DraftsList } from "@/components/DraftsList";
import { SentList } from "@/components/SentList";
import { Settings, RefreshCcw, LayoutDashboard, Inbox as InboxIcon, Bot, FileText, Leaf, Send, Sparkles, Menu, X } from "lucide-react";
import { Email, Draft, SentEmail } from "@/types";
import { predictNextEmail } from "@/lib/precog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type View = 'dashboard' | 'inbox' | 'agent' | 'drafts' | 'sent';

export default function Home() {
  return (
    <SWRConfig 
      value={{
        refreshInterval: 5000,
        fetcher: fetcher,
        revalidateOnFocus: false, 
        dedupingInterval: 2000,
      }}
    >
      <AppShell />
    </SWRConfig>
  );
}

interface Prediction {
    recipient: string;
    reason: string;
    confidence: number;
}

function AppShell() {
  const { data: emails, error: emailError } = useSWR<Email[]>('/api/emails');
  const { data: drafts, error: draftsError } = useSWR<Draft[]>('/api/drafts');
  const { data: sentEmails } = useSWR<SentEmail[]>('/api/sent');

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Run Pre-Cog Engine
  useEffect(() => {
      if (sentEmails) {
          const pred = predictNextEmail(sentEmails);
          if (pred) {
              setPrediction({
                  recipient: pred.recipient,
                  reason: pred.reason,
                  confidence: pred.confidence
              });
          }
      }
  }, [sentEmails]);

  const selectedEmail = emails?.find(e => e.id === selectedId) || null;

  const handleProcess = async (id: string) => {
    console.log(`[handleProcess] Starting process for email: ${id}`);
    setProcessingId(id);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailId: id }),
      });
      
      if (!res.ok) {
        let errorMessage = "Failed to process email";
        try {
             const data = await res.json();
             if (data.error && data.details) {
                 errorMessage = `${data.error}: ${data.details}`;
             } else {
                 errorMessage = data.error || data.details || errorMessage;
             }
        } catch (jsonError) {
             console.error("Could not parse JSON error response", jsonError);
        }
        throw new Error(errorMessage);
      }

      const processedEmail = await res.json();
      // Use processedEmail to update UI optimistically or just wait for revalidation
      console.log("Processed:", processedEmail.id);
      
      await Promise.all([
        mutate('/api/emails')
      ]);
      mutate((key) => typeof key === 'string' && key.startsWith('/api/emails'));

    } catch (e: unknown) {
      console.error("Process failed", e);
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setProcessingId(null);
    }
  };


  const handleReset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      await Promise.all([
         mutate('/api/emails'),
         mutate('/api/drafts'),
         mutate('/api/sent')
      ]);
      
      setSelectedId(null);
      setErrorMessage(null);
      setSuccessMessage("System fully reset. All emails marked as unread.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: unknown) {
      console.error(e);
      setErrorMessage("Failed to reset system.");
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => {
          setCurrentView(view);
          setIsSidebarOpen(false); // Close sidebar on mobile when navigating
      }}
      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-semibold translate-x-1' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${currentView === view ? 'text-white' : ''}`} />
      <span className="block text-sm">{label}</span>
      {currentView === view && (
         <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-md"></div>
      )}
    </button>
  );

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Global Toasts */}
      {(errorMessage || emailError || draftsError) && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[60] bg-red-500 text-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-top-5 fade-in duration-300 font-medium text-sm flex items-center gap-2">
          <span>⚠️ {errorMessage || "Connection Failed."}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-top-5 fade-in duration-300 font-medium text-sm flex items-center gap-2">
          <span>🔄 {successMessage}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col h-full border-r border-slate-800 z-40 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Section: Brand + Nav */}
        <div className="flex-1 flex flex-col min-h-0 p-4">
            
            {/* Brand */}
            <div className="flex items-center gap-3 px-2 py-4 mb-6 shrink-0 justify-between">
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-0 transition-transform"></div>
                      <Leaf className="w-6 h-6 text-white relative z-10" />
                   </div>
                   <div>
                     <h1 className="font-bold text-white text-lg tracking-tight">MailMint AI</h1>
                     <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Online</p>
                     </div>
                   </div>
               </div>
               <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
            </div>

            {/* Scrollable Nav Area */}
            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                
                <div className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Menu</p>
                    <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem view="inbox" icon={InboxIcon} label="Inbox" />
                    <NavItem view="agent" icon={Bot} label="AI Agent" />
                    <NavItem view="drafts" icon={FileText} label="Drafts" />
                    <NavItem view="sent" icon={Send} label="Sent" />
                </div>

            </div>
        </div>

        {/* Bottom Fixed Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0 space-y-2">
          <button 
             onClick={handleReset}
             className="w-full p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all flex items-center gap-3 text-sm group" 
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Reset System
          </button>
          <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-full p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-3 text-sm" 
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative bg-slate-50 flex flex-col">
        
        {/* Mobile Header (Hamburger) - Only visible on mobile */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600">
                    <Menu className="w-6 h-6" />
                </button>
                <span className="font-bold text-slate-900 text-lg capitalize">{currentView}</span>
            </div>
            {/* You could put user avatar or other icons here */}
        </div>

        {/* Pre-Cog Notification */}
        {prediction && currentView === 'dashboard' && (
            <div className="mx-4 md:mx-6 mt-6 mb-2 p-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white shadow-lg animate-in slide-in-from-top-4 duration-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                       <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                   </div>
                   <div>
                       <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Pre-Cog Engine Active</div>
                       <h3 className="font-bold text-lg leading-tight">Prediction: {prediction.recipient.split('@')[0]} needs an email.</h3>
                       <p className="text-sm opacity-90 mt-1">{prediction.reason} ({prediction.confidence}% Confidence)</p>
                   </div>
                </div>
                <button className="w-full md:w-auto bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm text-center">
                    Draft Now
                </button>
            </div>
        )}

        <div className="flex-1 overflow-hidden relative h-full">
            {currentView === 'dashboard' && (
              <Dashboard emails={emails || []} drafts={drafts || []} />
            )}

            {currentView === 'inbox' && (
              <div className="flex h-full animate-in fade-in duration-300">
                <Inbox 
                  emails={emails || []} 
                  selectedId={selectedId} 
                  onSelect={setSelectedId} 
                  className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80`}
                />
                <div className={`flex-1 flex relative shadow-xl z-0 bg-white ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
                  <EmailView 
                    email={selectedEmail} 
                    onProcess={handleProcess}
                    isProcessing={processingId === selectedId}
                    onBack={() => setSelectedId(null)}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {currentView === 'agent' && (
               <div className="h-full flex items-center justify-center p-4 md:p-10 animate-in zoom-in-95 duration-300">
                 <div className="w-full max-w-4xl h-full shadow-2xl rounded-2xl overflow-hidden bg-white flex border border-slate-200">
                   <div className="flex-1 flex flex-col">
                      <AgentChat contextEmailId={null} /> 
                   </div>
                 </div>
               </div>
            )}

            {currentView === 'drafts' && (
              <DraftsList drafts={drafts || []} />
            )}

            {currentView === 'sent' && (
              <SentList sentEmails={sentEmails || []} />
            )}
        </div>
      </div>

      {/* Settings Modal */}
      <PromptModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
