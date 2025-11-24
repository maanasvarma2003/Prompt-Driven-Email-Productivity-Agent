import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  const emails = db.getEmails();
  return NextResponse.json(emails);
}









