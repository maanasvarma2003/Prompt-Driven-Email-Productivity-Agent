import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { resilientGenerateObject } from '@/lib/resilient';
import { z } from 'zod';
import nlp from 'compromise';
import { getStyleContext } from '@/lib/style-learner';

const DraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export async function POST(req: Request) {
  try {
    const bodyJson = await req.json();
    const { emailId, instruction } = bodyJson; 
    const email = db.getEmail(emailId);

    if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });

    console.log(`⚡ Processing Draft for ${emailId}...`);
    
    // 1. Get User Style Context (Digital DNA)
    const userStyle = getStyleContext();
    
    const doc = nlp(email.body);
    const people = doc.people().out('array');
    const senderName = people.length > 0 ? people[0] : (email.sender.split('@')[0] || 'there');

    let draftContent = { subject: '', body: '' };
    
    try {
         // 2. Drafting with Digital DNA
         console.log(`🧠 Invoking Groq Llama3 for Draft...`);
         const { object } = await resilientGenerateObject({
            mode: 'smart', 
            schema: DraftSchema,
            prompt: `
              You are an AI Executive Assistant acting as the user.
              
              USER STYLE DNA:
              ${userStyle}
              
              TASK: Draft a reply based on the context below.
              
              From: ${email.sender}
              Subject: ${email.subject}
              Body: "${email.body.substring(0, 4000)}"
              User Instruction: "${instruction || "Reply appropriately."}"
              
              GUIDELINES:
              1. UNIQUE CONTENT: Do NOT use generic templates. Every reply MUST be 100% custom to this specific email content. Reference specific details, dates, names, and questions asked.
              2. NATURAL TONE: Mimic the User Style DNA exactly (tone, signature). Speak like a human, not a robot.
              3. NO WORD LIMIT: Write as much or as little as necessary to be effective and polite. Prioritize clarity and warmth.
              4. RELEVANCE: Address every point raised in the email directly.
            `,
            temperature: 0.3, 
         });
         
         const draftData = object as { subject: string; body: string };
         draftContent = { ...draftData };

    } catch (e) {
         console.error("⚠️ LLM Generation Failed:", e);
         draftContent = {
            subject: `Re: ${email.subject}`,
            body: `Hi ${senderName},\n\nI received your email regarding "${email.subject}" and will review it shortly.\n\nBest,\nMailMint AI Agent`
         };
    }

    // Save draft to store
    const draft = db.createDraft({
      id: Math.random().toString(36).substring(7),
      emailId: email.id,
      subject: draftContent.subject,
      body: draftContent.body,
      followUpSuggestions: [], 
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(draft);

  } catch (e: any) {
    console.error("Draft Error:", e);
    return NextResponse.json({ 
        error: "Draft Generation Failed", 
        details: e.message 
    }, { status: 500 });
  }
}
