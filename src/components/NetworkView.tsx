'use client';

import { useState, useEffect, useRef } from 'react';
import { Email } from '@/types';
// Dynamically import 3D library to avoid SSR issues
import dynamic from 'next/dynamic';

// ForceGraph3D wrapper
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

interface NetworkViewProps {
  emails: Email[];
}

export function NetworkView({ emails }: NetworkViewProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [xrMode, setXrMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
        });
    }
    
    // Resize handler
    const handleResize = () => {
       if (containerRef.current) {
         setDimensions({
             width: containerRef.current.offsetWidth,
             height: containerRef.current.offsetHeight
         });
       }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process Data for Graph
  const data = {
      nodes: [] as any[],
      links: [] as any[]
  };

  const people = new Set<string>();
  people.add("You");

  emails.forEach(e => {
      people.add(e.sender);
      data.links.push({ source: e.sender, target: "You", value: 1 });
  });

  Array.from(people).forEach(id => {
      data.nodes.push({ 
          id, 
          group: id === "You" ? 1 : 2,
          val: id === "You" ? 20 : (emails.filter(e => e.sender === id).length + 5) // Size by volume
      });
  });

  return (
    <div className={`h-full w-full bg-black relative overflow-hidden ${xrMode ? 'cursor-crosshair' : ''}`} ref={containerRef}>
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <h1 className="text-2xl font-black text-cyan-400 tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">NEURAL NET_3D</h1>
            <p className="text-xs text-cyan-600/80 font-mono">SPATIAL COMPUTING INTERFACE</p>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
           <button 
             onClick={() => setXrMode(!xrMode)}
             className={`px-3 py-1 text-xs font-bold border rounded backdrop-blur-md transition-all ${xrMode ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_#22d3ee]' : 'bg-black/50 text-cyan-400 border-cyan-900 hover:bg-cyan-900/30'}`}
           >
             {xrMode ? 'EXIT XR' : 'ENTER XR MODE'}
           </button>
        </div>
        
        <ForceGraph3D
            width={dimensions.width}
            height={dimensions.height}
            graphData={data}
            nodeAutoColorBy="group"
            nodeLabel="id"
            linkColor={() => "#22d3ee"}
            linkWidth={1}
            linkOpacity={0.3}
            backgroundColor="#000000"
            nodeResolution={16}
            // Make "You" glow
            nodeColor={(node: any) => node.id === "You" ? "#ff00ff" : "#22d3ee"}
            controlType={xrMode ? "fly" : "orbit"} // 'fly' simulates being inside
        />
        
        {/* XR Overlay Guidelines */}
        {xrMode && (
          <div className="absolute inset-0 pointer-events-none border-[20px] border-cyan-500/10 rounded-[50px] flex items-center justify-center">
             <div className="w-10 h-10 border border-cyan-500/30 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
             </div>
          </div>
        )}
    </div>
  );
}
