import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { draftId, attachments } = await req.json();
    
    // Simulate sending (Wait 1s)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const sentEmail = db.sendDraft(draftId, attachments);

    if (!sentEmail) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
