'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 text-slate-800 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900">Something went wrong!</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          We encountered an unexpected error. This usually happens due to network issues or missing configuration.
        </p>
        <div className="bg-slate-100 p-4 rounded-lg mb-6 text-left overflow-hidden">
          <p className="text-xs font-mono text-slate-600 break-all">
            {error.message || "Unknown Error"}
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}










