import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function POST() {
  db.reset();
  return NextResponse.json({ 
    message: "Database reset successfully",
    emails: db.getEmails(), // Return fresh state
    drafts: []
  });
}
