'use client';

import { SentEmail } from "@/types";
import { Send, CheckCircle } from "lucide-react";

interface SentListProps {
  sentEmails: SentEmail[];
}

export function SentList({ sentEmails }: SentListProps) {
  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50/50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Sent Mails</h1>
        <p className="text-slate-500">History of sent replies</p>
      </div>

      {sentEmails.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Send className="w-12 h-12 mb-4 opacity-20" />
          <p>No sent emails yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sentEmails.map((email) => (
            <div key={email.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                       <CheckCircle className="w-3 h-3" /> Sent
                    </span>
                    {email.subject}
                  </h3>
                  <p className="text-xs text-slate-400">To: <span className="font-medium text-slate-600">{email.recipient}</span> • {new Date(email.sentAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 font-mono whitespace-pre-wrap">
                {email.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
