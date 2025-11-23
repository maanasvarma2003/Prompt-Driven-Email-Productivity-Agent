'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Email } from "@/types";
import { Check, X, Clock, Archive } from "lucide-react";

interface FocusModeProps {
  emails: Email[];
  onAction: (id: string, action: 'archive' | 'delete' | 'reply_later') => void;
}

export function FocusMode({ emails, onAction }: FocusModeProps) {
  const [index, setIndex] = useState(0);
  
  // Only show unread emails
  const queue = emails.filter(e => !e.isRead);
  const currentEmail = queue[index];

  const handleSwipe = (direction: string) => {
      if (!currentEmail) return;
      
      if (direction === 'right') onAction(currentEmail.id, 'archive');
      else if (direction === 'left') onAction(currentEmail.id, 'delete');
      else if (direction === 'up') onAction(currentEmail.id, 'reply_later');

      setIndex(index + 1);
  };

  if (!currentEmail) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">You're all caught up!</h2>
              <p className="text-slate-500">Inbox Zero achieved.</p>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative p-4 md:p-6">
       <div className="absolute top-10 text-slate-400 font-medium uppercase tracking-widest text-xs">Focus Mode</div>
       
       <AnimatePresence>
         <motion.div
            key={currentEmail.id}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              if (swipe > 100) handleSwipe('right');
              else if (swipe < -100) handleSwipe('left');
            }}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing"
         >
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-2">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{currentEmail.subject}</h1>
                        <div className="flex items-center gap-2 text-slate-500 text-sm md:text-base">
                            <span className="font-medium text-indigo-600">{currentEmail.sender}</span>
                            <span>•</span>
                            <span>{new Date(currentEmail.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                    {currentEmail.category && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wide shrink-0">
                            {currentEmail.category}
                        </span>
                    )}
                </div>
                
                <div className="prose prose-slate max-w-none">
                    <p className="text-base md:text-lg leading-relaxed text-slate-700">{currentEmail.body}</p>
                </div>
            </div>
            
            {/* Controls Hint */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1"><X className="w-4 h-4 text-rose-400" /> Delete (Left)</div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-blue-400" /> Later (Up)</div>
                <div className="flex items-center gap-1 text-emerald-600"><Archive className="w-4 h-4" /> Archive (Right)</div>
            </div>
         </motion.div>
       </AnimatePresence>
       
       {/* Action Buttons for Click */}
       <div className="flex gap-4 md:gap-6 mt-8">
           <button onClick={() => handleSwipe('left')} className="p-3 md:p-4 bg-white rounded-full shadow-lg text-rose-500 hover:bg-rose-50 transition-colors"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
           <button onClick={() => handleSwipe('up')} className="p-3 md:p-4 bg-white rounded-full shadow-lg text-blue-500 hover:bg-blue-50 transition-colors"><Clock className="w-6 h-6 md:w-8 md:h-8" /></button>
           <button onClick={() => handleSwipe('right')} className="p-3 md:p-4 bg-white rounded-full shadow-lg text-emerald-500 hover:bg-emerald-50 transition-colors"><Archive className="w-6 h-6 md:w-8 md:h-8" /></button>
       </div>
    </div>
  );
}
