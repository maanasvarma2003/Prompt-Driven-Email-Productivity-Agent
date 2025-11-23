'use client';
import React, { useState, useEffect } from 'react';
import { runAutopilotCheck, AutonomyAction } from '../lib/autonomy';

export default function DigitalDNA() {
  const [logs, setLogs] = useState<AutonomyAction[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock Digital DNA Profile (In a real app, this would be editable)
  const dnaProfile = "Risk Tolerance: Low. Financial Cap: $50. Communication Style: Formal. Priorities: Health, Wealth.";
  const mockEvents = [
    "Received invoice for $45.00 from Netflix (Subscription renewal).",
    "Received email from 'Prince of Nigeria' requesting bank details.",
    "Calendar conflict detected: Meeting with John overlaps with Dentist.",
    "Internet bill jumped to $90 from $70."
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      const actions = await runAutopilotCheck(dnaProfile, mockEvents);
      setLogs(actions);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-black/20 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-cyan-400">🧬</span> DIGITAL DNA <span className="text-xs font-normal text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">LEVEL 5 AUTONOMY</span>
        </h3>
        <div className="flex gap-2 text-xs font-mono">
           <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded border border-green-500/20">ACTIVE</div>
           <div className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded">UPTIME: 99.9%</div>
        </div>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
        {loading ? (
             <div className="text-zinc-500 font-mono text-xs animate-pulse">Scanning life admin events...</div>
        ) : logs.length > 0 ? (
          logs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800/50 text-sm">
              <div className="mt-1">
                {log.type === 'Financial' && '💰'}
                {log.type === 'Communication' && '📧'}
                {log.type === 'Scheduling' && '📅'}
                {log.type === 'Legal' && '⚖️'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                   <span className="text-zinc-300 font-medium">{log.description}</span>
                   <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                     log.status === 'Completed' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'
                   }`}>{log.status}</span>
                </div>
                {log.moneySaved && (
                   <div className="text-xs text-green-400 mt-1 font-mono">Saved: ${log.moneySaved}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-zinc-600 text-sm">No autonomous actions taken recently.</div>
        )}
      </div>
    </div>
  );
}

