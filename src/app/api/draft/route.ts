import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { resilientGenerateObject } from '@/lib/resilient';
import { z } from 'zod';
import nlp from 'compromise';
import { getStyleContext, learnFromEdit } from '@/lib/style-learner';

const DraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  confidenceScore: z.number().min(0).max(100).describe("Confidence score of the draft (0-100)"),
  riskAssessment: z.string().describe("Brief assessment of any risks or uncertainties in the draft"),
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
    
    // --- MEMORY CORE RETRIEVAL ---
    const memoryContext = db.searchMemory(`${email.subject} ${email.sender} ${email.body.substring(0, 100)}`)
        .map(r => `- [Past Context] ${r.text}`)
        .join('\n');

    const doc = nlp(email.body);
    const people = doc.people().out('array');
    const senderName = people.length > 0 ? people[0] : (email.sender.split('@')[0] || 'there');
    
    // ...
    
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
              
              MEMORY CONTEXT (Past interactions):
              ${memoryContext || "No relevant past context found."}
              
              TASK: Draft a reply based on the context below.
              
              From: ${email.sender}
              Subject: ${email.subject}
              Body: "${email.body.substring(0, 4000)}"
              User Instruction: "${instruction || "Reply appropriately."}"
              
              GUIDELINES:
              1. Mimic the User Style DNA exactly (tone, signature).
              2. Be concise and professional.
              3. Assess your own confidence. If data is missing (e.g. user asks for attachment but none provided, or asks about a date not known), lower the score.
            `,
            temperature: 0.3, 
         });
         
         const draftData = object as { subject: string; body: string; confidenceScore: number; riskAssessment: string };
         draftContent = { ...draftData };

    } catch (e) {
         console.error("⚠️ LLM Generation Failed:", e);
         draftContent = {
            subject: `Re: ${email.subject}`,
            body: `Hi ${senderName},\n\nI received your email regarding "${email.subject}" and will review it shortly.\n\nBest,\nMailMint AI Agent`,
            confidenceScore: 50,
            riskAssessment: "Draft generated via fallback due to AI error."
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
      confidenceScore: draftContent.confidenceScore,
      riskAssessment: draftContent.riskAssessment,
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
