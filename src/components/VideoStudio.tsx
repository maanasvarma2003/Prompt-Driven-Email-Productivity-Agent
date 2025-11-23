'use client';
import React, { useState } from 'react';
import { Video, Sparkles, MonitorPlay } from 'lucide-react';

export default function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setGeneratedVisual(null);
    setRefinedPrompt(null);

    try {
      // 1. Get Refined Visual Prompt from Groq
      const res = await fetch('/api/video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Failed to generate visual description");
      
      const data = await res.json();
      setRefinedPrompt(data.visualDescription);

      // 2. Generate High-Fidelity Visual (using Pollinations for instant feedback)
      // We use a random seed to ensure freshness
      const seed = Math.floor(Math.random() * 1000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(data.visualDescription)}?width=1024&height=576&seed=${seed}&nologo=true`;
      
      // Simulate "Video Rendering" time for effect, but load image in background
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
         setGeneratedVisual(imageUrl);
         setIsGenerating(false);
      };

    } catch (error) {
      console.error("Generation failed", error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-black/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-md h-full flex flex-col shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
             <Video className="w-5 h-5 text-pink-500" />
          </span>
          <span className="tracking-tight">HYPER-REAL AVATAR</span>
          <span className="text-[10px] font-normal text-zinc-400 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">GEN-2 ENGINE</span>
        </h3>
      </div>

      {/* Visual Preview Area */}
      <div className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 relative overflow-hidden flex items-center justify-center group shadow-inner">
        {isGenerating ? (
           <div className="text-center space-y-4 relative z-10">
             <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-pink-500/30 rounded-full animate-ping"></div>
                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <div>
                <div className="text-sm font-mono text-pink-400 animate-pulse font-bold">SYNTHESIZING DIGITAL TWIN...</div>
                <div className="text-xs text-zinc-500 mt-1">Aligning Lip Sync • Cloning Voice • Rendering 4K</div>
             </div>
           </div>
        ) : generatedVisual ? (
          <div className="relative w-full h-full group cursor-pointer">
             {/* The Generated Content */}
             <img 
               src={generatedVisual} 
               alt="AI Generated Avatar" 
               className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105" 
             />
             
             {/* Video UI Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                   <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded animate-pulse">● REC</span>
                   <span className="px-2 py-1 bg-black/50 backdrop-blur text-zinc-300 text-[10px] font-mono rounded border border-white/10">4K • 60FPS</span>
                </div>
                
                <div className="flex items-center justify-center">
                   <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 hover:scale-110 transition-all">
                      <MonitorPlay className="w-8 h-8 text-white fill-white" />
                   </div>
                </div>

                <div className="space-y-2">
                   <p className="text-xs text-zinc-300 font-mono line-clamp-1 opacity-80">PROMPT: {refinedPrompt}</p>
                   <div className="flex gap-2">
                      <button onClick={() => setGeneratedVisual(null)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded font-bold border border-zinc-700">DISCARD</button>
                      <button className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs rounded font-bold shadow-[0_0_15px_rgba(236,72,153,0.4)]">ATTACH TO EMAIL</button>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="text-center text-zinc-700 relative z-10">
             <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <Video className="w-8 h-8 opacity-20" />
             </div>
             <div className="text-sm font-bold text-zinc-500">NO ASSET GENERATED</div>
             <div className="text-xs font-mono text-zinc-600 mt-1">Enter a script to render your avatar</div>
          </div>
        )}
        
        {/* Grid/Tech Background Overlay */}
        {!generatedVisual && (
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-3">
         <div className="relative">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should your avatar say? (e.g., 'Apologize for the delay professionally')"
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 text-sm text-zinc-300 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 outline-none resize-none h-24 transition-all placeholder:text-zinc-700"
            />
            <div className="absolute bottom-3 right-3">
               <Sparkles className={`w-4 h-4 ${prompt ? 'text-pink-500' : 'text-zinc-700'}`} />
            </div>
         </div>
         
         <button 
           onClick={handleGenerate}
           disabled={isGenerating || !prompt}
           className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
         >
           {isGenerating ? 'RENDERING SCENE...' : 'GENERATE DIGITAL TWIN'}
         </button>
      </div>
    </div>
  );
}
