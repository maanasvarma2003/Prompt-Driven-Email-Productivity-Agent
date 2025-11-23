'use client';
import React, { useState } from 'react';
import { runWarRoomSimulation, WarRoomReport } from '../lib/simulation';

interface WarRoomProps {
  draft: string;
  recipientProfile: string;
  onClose: () => void;
}

export default function WarRoom({ draft, recipientProfile, onClose }: WarRoomProps) {
  const [simulating, setSimulating] = useState(false);
  const [report, setReport] = useState<WarRoomReport | null>(null);
  const [userGoal, setUserGoal] = useState('');

  const startSimulation = async () => {
    if (!userGoal) return;
    setSimulating(true);
    try {
      const result = await runWarRoomSimulation(draft, recipientProfile, userGoal);
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-xl p-4">
      <div className="bg-zinc-900 border border-purple-500/30 w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_#a855f7]"></div>
            <h2 className="text-xl font-mono tracking-widest text-white">WAR ROOM <span className="text-purple-400 text-sm">// PREDICTIVE ENGINE</span></h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕_CLOSE</button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {!report ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
               <div className="w-full max-w-md">
                 <label className="text-xs text-zinc-500 font-mono uppercase mb-2 block">Define Strategic Objective</label>
                 <input 
                    type="text" 
                    value={userGoal}
                    onChange={(e) => setUserGoal(e.target.value)}
                    placeholder="e.g., Close the deal at $50k, Get a refund, Apologize without admitting fault..."
                    className="w-full bg-black border border-zinc-700 p-4 text-white rounded-lg focus:border-purple-500 outline-none font-mono"
                 />
               </div>
               <button 
                 onClick={startSimulation}
                 disabled={simulating || !userGoal}
                 className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wider rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
               >
                 {simulating ? 'RUNNING SIMULATION MATRIX...' : 'INITIATE SIMULATION'}
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* Main Stats */}
              <div className="md:col-span-1 space-y-6">
                <div className="p-6 bg-black/40 border border-zinc-800 rounded-xl text-center">
                  <div className="text-sm text-zinc-500 mb-2 font-mono">PROBABILITY OF SUCCESS</div>
                  <div className={`text-6xl font-black ${report.overallSuccessChance > 70 ? 'text-green-400' : report.overallSuccessChance > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {report.overallSuccessChance}%
                  </div>
                </div>
                <div className="p-6 bg-black/40 border border-zinc-800 rounded-xl text-center">
                  <div className="text-sm text-zinc-500 mb-2 font-mono">RISK SCORE</div>
                  <div className={`text-6xl font-black ${report.riskScore < 30 ? 'text-green-400' : 'text-red-500'}`}>
                    {report.riskScore}
                  </div>
                </div>
                <div className="p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                  <div className="text-xs text-purple-400 mb-2 font-mono">STRATEGIC ADVICE</div>
                  <p className="text-sm text-zinc-300">{report.strategicAdvice}</p>
                </div>
              </div>

              {/* Scenarios */}
              <div className="md:col-span-2 space-y-4 overflow-y-auto pr-2">
                <h3 className="text-sm font-mono text-zinc-500 uppercase">Simulated Futures</h3>
                {report.scenarios.map((scenario) => (
                  <div key={scenario.id} className="p-5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-xs font-bold px-2 py-1 rounded ${
                         scenario.outcome === 'Success' ? 'bg-green-900/50 text-green-400' : 
                         scenario.outcome === 'Failure' ? 'bg-red-900/50 text-red-400' : 'bg-zinc-700 text-zinc-300'
                       }`}>
                         {scenario.outcome.toUpperCase()}
                       </span>
                       <span className="text-xs font-mono text-zinc-500">PROB: {scenario.probability}%</span>
                    </div>
                    <p className="text-zinc-300 text-sm mb-3">"{scenario.recipientReaction}"</p>
                    <div className="text-xs text-purple-300 bg-purple-900/20 p-2 rounded border border-purple-500/10">
                      💡 {scenario.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

