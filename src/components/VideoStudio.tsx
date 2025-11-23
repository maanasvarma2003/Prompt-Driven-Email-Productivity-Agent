'use client';
import React, { useState } from 'react';

export default function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Mock API delay
    setTimeout(() => {
      setIsGenerating(false);
      // Mock video placeholder (using a generic tech background or loop)
      setVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"); // Valid sample video for demo
    }, 3000);
  };

  return (
    <div className="bg-black/20 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-pink-500">🎥</span> HYPER-REAL AVATAR <span className="text-xs font-normal text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">BETA</span>
        </h3>
      </div>

      {/* Video Preview Area */}
      <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative overflow-hidden flex items-center justify-center group">
        {isGenerating ? (
           <div className="text-center space-y-3">
             <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
             <div className="text-xs font-mono text-pink-400 animate-pulse">SYNTHESIZING DIGITAL TWIN...</div>
             <div className="text-xs text-zinc-600">Aligning Lip Sync • Cloning Voice • Rendering 4K</div>
           </div>
        ) : videoUrl ? (
          <div className="relative w-full h-full bg-black">
             <video src={videoUrl} autoPlay loop muted className="w-full h-full object-cover opacity-80" />
             <div className="absolute bottom-4 right-4 flex gap-2">
               <button onClick={() => setVideoUrl(null)} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded">DISCARD</button>
               <button className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white text-xs rounded font-bold">ATTACH TO EMAIL</button>
             </div>
          </div>
        ) : (
          <div className="text-center text-zinc-700">
             <div className="text-4xl mb-2 opacity-20">👤</div>
             <div className="text-xs font-mono">NO VIDEO GENERATED</div>
          </div>
        )}
        
        {/* Scanlines overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-2">
         <textarea 
           value={prompt}
           onChange={(e) => setPrompt(e.target.value)}
           placeholder="Type what your avatar should say..."
           className="w-full bg-zinc-900/50 border border-zinc-800 p-3 text-sm text-zinc-300 rounded focus:border-pink-500 outline-none resize-none h-20"
         />
         <button 
           onClick={handleGenerate}
           disabled={isGenerating || !prompt}
           className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-xs rounded tracking-wider disabled:opacity-50"
         >
           {isGenerating ? 'RENDERING...' : 'GENERATE 4K VIDEO'}
         </button>
      </div>
    </div>
  );
}

