import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { draftId, attachments } = body;
    
    if (!draftId) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }
    
    // Validate draft exists before attempting to send
    const draft = db.getDrafts().find(d => d.id === draftId);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    
    // Simulate sending (Wait 1s)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const sentEmail = db.sendDraft(draftId, attachments);

    if (!sentEmail) {
      console.error(`Failed to send draft ${draftId}: Draft not found in store`);
      return NextResponse.json({ 
        error: "Failed to send email", 
        details: "Draft could not be processed. Please try creating a new draft." 
      }, { status: 500 });
    }

    // Return success with the sent email data for verification
    return NextResponse.json({ 
      success: true, 
      message: "Email sent successfully",
      sentEmail: {
        id: sentEmail.id,
        recipient: sentEmail.recipient,
        subject: sentEmail.subject,
        sentAt: sentEmail.sentAt
      }
    });
  } catch (error) {
    console.error("Send error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: "Failed to send email",
      details: errorMessage
    }, { status: 500 });
  }
}
