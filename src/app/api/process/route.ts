import { NextResponse } from 'next/server';
import { processEmail } from '@/lib/processing';

export async function POST(req: Request) {
  try {
    const { emailId } = await req.json();
    const updatedEmail = await processEmail(emailId);
    return NextResponse.json(updatedEmail);
  } catch (error: unknown) {
    console.error("Critical Error processing email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ 
        error: "Processing Failed", 
        details: errorMessage,
        stack: stack 
    }, { status: 500 });
  }
}
