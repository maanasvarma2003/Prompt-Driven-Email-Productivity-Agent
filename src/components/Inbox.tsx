'use client';

import { Email } from "@/types";
import { Inbox as InboxIcon, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface InboxProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string; // Add className support for visibility toggling
}

export function Inbox({ emails, selectedId, onSelect, className = '' }: InboxProps) {
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Important'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize filtered emails to prevent re-calculation on every render
  const filteredEmails = useMemo(() => {
    // Ensure emails is defined
    if (!emails) return [];

    // Filter Logic
    const result = emails.filter(e => {
       // 1. Tab Filter
       if (filter === 'Unread' && e.isRead) return false;
       if (filter === 'Important' && e.category !== 'Important') return false;

       // 2. Search Query (Case Insensitive)
       if (searchQuery) {
         const q = searchQuery.toLowerCase();
         return (
           e.subject.toLowerCase().includes(q) || 
           e.sender.toLowerCase().includes(q) || 
           e.body.toLowerCase().includes(q)
         );
       }

       return true;
    });

    // Sort by Date Descending (Latest First)
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, filter, searchQuery]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!emails || emails.length === 0) return;
        
        // If nothing selected, select first on arrow key
        if (!selectedId) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (filteredEmails.length > 0) onSelect(filteredEmails[0].id);
            }
            return;
        }

        const currentIndex = filteredEmails.findIndex(email => email.id === selectedId);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = Math.min(filteredEmails.length - 1, currentIndex + 1);
            if (filteredEmails[nextIndex]) onSelect(filteredEmails[nextIndex].id);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = Math.max(0, currentIndex - 1);
            if (filteredEmails[prevIndex]) onSelect(filteredEmails[prevIndex].id);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, filteredEmails, onSelect, emails]); 

  return (
    <div className={`w-full md:w-80 flex flex-col border-r border-slate-200 bg-white h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
            <InboxIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight">Inbox</h1>
          </div>
          <span className="ml-auto text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
            {emails?.length || 0}
          </span>
        </div>

        {/* Search & Filter */}
        <div className="space-y-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {['All', 'Unread', 'Important'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                    filter === f 
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth custom-scrollbar">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
               <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">No emails found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                selectedId === email.id 
                  ? 'bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-1.5 gap-2">
                <span className={`text-sm truncate flex-1 ${!email.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                  {email.sender}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono whitespace-nowrap">
                  {new Date(email.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              <div className={`text-sm mb-1.5 truncate pr-4 ${!email.isRead ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'}`}>
                {email.subject}
              </div>
              
              <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed opacity-80 mb-3">
                {email.body}
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {email.category && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide uppercase border ${
                    email.category === 'Important' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    email.category === 'To-Do' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    email.category === 'Newsletter' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    email.category === 'Spam' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {email.category}
                  </span>
                )}
                
                {!email.isRead && (
                   <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 absolute top-4 right-4 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
