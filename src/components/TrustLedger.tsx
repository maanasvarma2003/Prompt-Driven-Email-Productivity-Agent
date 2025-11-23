'use client';
import React, { useState } from 'react';

export default function TrustLedger() {
  const [signed, setSigned] = useState(false);
  const [hash, setHash] = useState('');

  const signEmail = () => {
    // Mock crypto signing
    const mockHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setHash(mockHash);
    setSigned(true);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg mt-2">
      <div className="flex items-center gap-3">
        <div className="text-xl">🛡️</div>
        <div>
          <div className="text-xs font-bold text-blue-400 font-mono">QUANTUM-PROOF TRUTH LEDGER</div>
          <div className="text-[10px] text-zinc-500">
            {signed ? `VERIFIED: ${hash.substring(0, 10)}...` : 'Not signed. Recipient cannot verify authenticity.'}
          </div>
        </div>
      </div>
      <button
        onClick={signEmail}
        disabled={signed}
        className={`px-3 py-1.5 text-xs font-bold rounded tracking-wide transition-all ${
          signed 
            ? 'bg-green-500/20 text-green-400 cursor-default border border-green-500/50' 
            : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
        }`}
      >
        {signed ? '✔ ON-CHAIN' : 'SIGN & VERIFY'}
      </button>
    </div>
  );
}




