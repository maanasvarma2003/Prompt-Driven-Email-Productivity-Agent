import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  const sentEmails = db.getSentEmails();
  const sorted = [...sentEmails].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  return NextResponse.json(sorted);
}






