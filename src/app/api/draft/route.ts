import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { resilientGenerateObject } from '@/lib/resilient';
import { z } from 'zod';
import nlp from 'compromise';
import { getStyleContext, learnFromEdit } from '@/lib/style-learner';
import { generateSwarmDraft } from '@/lib/swarm';

const DraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  swarmAnalysis: z.string().optional().describe("Internal reasoning from swarm"),
});

export async function POST(req: Request) {
  try {
    const bodyJson = await req.json();
    const { emailId, instruction, mode = 'standard' } = bodyJson; // mode: 'standard' | 'swarm'
    const email = db.getEmail(emailId);

    if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });

    console.log(`⚡ Processing Draft for ${emailId} (Mode: ${mode})...`);
    
    // 1. Get User Style Context (Digital DNA)
    const userStyle = getStyleContext();
    
    const doc = nlp(email.body);
    const people = doc.people().out('array');
    const senderName = people.length > 0 ? people[0] : (email.sender.split('@')[0] || 'there');

    let draftContent = { subject: '', body: '', swarmAnalysis: '' };
    
    try {
         // 2. Swarm Logic (if enabled)
         let contextData = `
            From: ${email.sender}
            Subject: ${email.subject}
            Body: "${email.body.substring(0, 4000)}"
            User Instruction: "${instruction || "Reply appropriately."}"
         `;

         if (mode === 'swarm') {
            console.log("🐝 Engaging Swarm Agents...");
            contextData = await generateSwarmDraft(email.body, instruction || "Reply appropriately");
         }

         // 3. Drafting with Digital DNA
         console.log(`🧠 Invoking Groq Llama3 for Draft...`);
         const { object } = await resilientGenerateObject({
            mode: 'smart', 
            schema: DraftSchema,
            prompt: `
              You are an AI Executive Assistant acting as the user.
              
              USER STYLE DNA:
              ${userStyle}
              
              TASK: Draft a reply based on the context below.
              
              ${contextData}
              
              GUIDELINES:
              1. Mimic the User Style DNA exactly (tone, signature).
              2. If Swarm Research is provided, use it to be factual.
              3. If Swarm Schedule is provided, propose those times.
            `,
            temperature: 0.3, 
         });
         
         const draftData = object as { subject: string; body: string; swarmAnalysis?: string };
         draftContent = { ...draftData, swarmAnalysis: draftData.swarmAnalysis || '' };

    } catch (e) {
         console.error("⚠️ LLM Generation Failed:", e);
         draftContent = {
            subject: `Re: ${email.subject}`,
            body: `Hi ${senderName},\n\nI received your email regarding "${email.subject}" and will review it shortly.\n\nBest,\nMailMint AI Agent`,
            swarmAnalysis: "Generation failed."
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

    return NextResponse.json({ ...draft, swarmAnalysis: draftContent.swarmAnalysis });

  } catch (e: any) {
    console.error("Draft Error:", e);
    return NextResponse.json({ 
        error: "Draft Generation Failed", 
        details: e.message 
    }, { status: 500 });
  }
}
