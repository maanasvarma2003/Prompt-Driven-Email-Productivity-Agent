import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { FAST_MODEL } from '@/lib/ai';
import { groq } from '@/lib/groq';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { emailId } = await req.json();
    const email = db.getEmail(emailId);

    if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Zero-Shot Classification for Quick Replies
    // Using Groq 8B for instant results
    const { object } = await generateObject({
      model: groq(FAST_MODEL) as any,
      schema: z.object({ chips: z.array(z.string()).max(3) }),
      prompt: `
        Generate 3 short, polite reply options (max 4 words each) for this email.
        
        Email: "${email.body.substring(0, 500)}"
        
        Examples: "Yes, I'm available", "Send more details", "Not interested".
      `,
      temperature: 0.1,
    });

    return NextResponse.json(object.chips);
  } catch (e) {
    console.error("Chips Error:", e);
    return NextResponse.json(['Received', 'Reviewing', 'Thanks']);
  }
}

