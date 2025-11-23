import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  const drafts = db.getDrafts();
  // Sort by newest first
  const sorted = [...drafts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(sorted);
}







