import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading Agent...</p>
      </div>
    </div>
  );
}







