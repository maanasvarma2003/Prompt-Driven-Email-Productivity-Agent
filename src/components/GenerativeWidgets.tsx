import React from 'react';
import { Calendar, Plane, FileSignature } from 'lucide-react';

interface WidgetProps {
  type: 'calendar' | 'flight' | 'contract';
  data: any;
}

export function GenerativeWidget({ type }: WidgetProps) {
  if (type === 'calendar') {
    return (
      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm my-3 animate-in slide-in-from-top-2">
        <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4" /> Suggested Times
        </div>
        <div className="flex gap-2">
          {['Tue, 10:00 AM', 'Wed, 2:00 PM', 'Fri, 11:30 AM'].map((time) => (
             <button key={time} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-300 transition-all">
               {time}
             </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'flight') {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md my-3 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Plane className="w-24 h-24" />
         </div>
         <div className="relative z-10">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Boarding Pass</div>
            <div className="text-2xl font-mono font-bold">SFO ➔ JFK</div>
            <div className="flex gap-4 mt-2 text-sm text-slate-300">
               <div><span className="text-slate-500 text-[10px] block">FLIGHT</span>UA452</div>
               <div><span className="text-slate-500 text-[10px] block">GATE</span>B4</div>
               <div><span className="text-slate-500 text-[10px] block">SEAT</span>12A</div>
            </div>
         </div>
      </div>
    );
  }

  if (type === 'contract') {
    return (
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm my-3 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
               <FileSignature className="w-5 h-5" />
            </div>
            <div>
               <div className="text-sm font-bold text-amber-900">Sign Contract</div>
               <div className="text-xs text-amber-700">NDA_v2.pdf</div>
            </div>
         </div>
         <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm">
            Sign Now
         </button>
      </div>
    );
  }

  return null;
}

