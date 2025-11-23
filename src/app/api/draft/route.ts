import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { resilientGenerateObject } from '@/lib/resilient';
import { runSwarm } from '@/lib/swarm';
import { z } from 'zod';
import nlp from 'compromise';

const DraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export async function POST(req: Request) {
  try {
    const bodyJson = await req.json();
    const { emailId, instruction, mode } = bodyJson; // mode: 'standard' | 'swarm'
    const email = db.getEmail(emailId);

    if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });

    console.log(`⚡ Processing High-Fidelity Draft for ${emailId} (Mode: ${mode || 'Standard'})...`);
    
    const doc = nlp(email.body);
    const people = doc.people().out('array');
    const senderName = people.length > 0 ? people[0] : (email.sender.split('@')[0] || 'there');

    let draftContent = { subject: '', body: '', swarmAnalysis: '' };
    
    try {
         if (mode === 'swarm') {
             console.log("🐝 Activating Swarm Mode (Multi-Agent Debate)...");
             const swarmResult = await runSwarm(`
                Sender: ${email.sender}
                Subject: ${email.subject}
                Body: "${email.body}"
                Instruction: "${instruction || "Reply appropriately."}"
             `);
             draftContent = { ...swarmResult };
         } else {
             console.log(`🧠 Invoking Groq Llama3 (SMART_MODEL) for World-Class Draft...`);
             const { object } = await resilientGenerateObject({
                mode: 'smart', 
                schema: DraftSchema,
                prompt: `
                  You are a world-class Executive Assistant known for perfect, precise, and professional communication.
                  
                  TASK: Draft a reply to the email below.
                  
                  CONTEXT:
                  - From: ${email.sender}
                  - Subject: ${email.subject}
                  - Body: "${email.body.substring(0, 4000)}"
                  - User Instruction: "${instruction || "Reply appropriately. Be concise and polite."}"
                  
                  GUIDELINES:
                  1. Tone: Professional, confident, and warm.
                  2. Precision: Address all key points from the email directly.
                  3. Format: Clean, with proper spacing. No placeholders like "[Your Name]" - sign off as "MailMint AI Agent".
                  4. Length: Concise (under 150 words) unless the topic requires depth.
                `,
                temperature: 0.3, 
             });
             const draftData = object as { subject: string; body: string };
             draftContent = { ...draftData, swarmAnalysis: '' };
         }
         
         console.log("✅ AI generated draft successfully.");

    } catch (e) {
         console.error("⚠️ LLM Generation Failed:", e);
         draftContent = {
            subject: `Re: ${email.subject}`,
            body: `Hi ${senderName},\n\nI received your email regarding "${email.subject}" and will review it shortly.\n\nBest,\nMailMint AI Agent`,
            swarmAnalysis: ''
         };
    }

    // Double check we have content before saving
    if (!draftContent || !draftContent.body) {
         draftContent = {
            subject: `Re: ${email.subject}`,
            body: `Hi ${senderName},\n\n(Draft generation encountered an issue. Please edit manually.)\n\nBest,\nMailMint AI Agent`,
            swarmAnalysis: ''
         };
    }

    // Save draft to store
    const draft = db.createDraft({
      id: Math.random().toString(36).substring(7),
      emailId: email.id,
      subject: draftContent.subject,
      body: draftContent.body,
      followUpSuggestions: draftContent.swarmAnalysis ? [draftContent.swarmAnalysis] : [], // Store analysis in suggestions for now
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
