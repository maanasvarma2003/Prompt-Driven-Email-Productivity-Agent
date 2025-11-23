import { NextResponse } from 'next/server';
import { processEmail } from '@/lib/processing';

export async function POST(req: Request) {
  try {
    const { emailId } = await req.json();
    const updatedEmail = await processEmail(emailId);
    return NextResponse.json(updatedEmail);
  } catch (error: any) {
    console.error("Critical Error processing email:", error);
    return NextResponse.json({ 
        error: "Processing Failed", 
        details: error.message,
        stack: error.stack 
    }, { status: 500 });
  }
}
