'use client';

import { useState, useEffect, useRef } from 'react';
import { Email } from '@/types';
import ForceGraph2D from 'react-force-graph-2d';

interface NetworkViewProps {
  emails: Email[];
}

export function NetworkView({ emails }: NetworkViewProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
        });
    }
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
          val: emails.filter(e => e.sender === id).length * 2 // Size by volume
      });
  });

  return (
    <div className="h-full w-full bg-slate-900 relative overflow-hidden" ref={containerRef}>
        <div className="absolute top-4 left-4 z-10">
            <h1 className="text-2xl font-bold text-emerald-400 tracking-widest">NEURAL NET</h1>
            <p className="text-xs text-emerald-600/80">Connection Graph</p>
        </div>
        
        {/* Client-side only wrapper often needed for these libs in Next.js */}
        <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={data}
            nodeAutoColorBy="group"
            nodeLabel="id"
            linkColor={() => "#4ade80"}
            linkWidth={1}
            backgroundColor="#0f172a"
        />
    </div>
  );
}


