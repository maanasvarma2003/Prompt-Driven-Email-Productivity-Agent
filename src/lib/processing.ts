import { db } from '@/lib/store';
import { aiCache } from '@/lib/cache';
import { resilientGenerateObject } from '@/lib/resilient';
import { z } from 'zod';

// Schema for LLM analysis
const AnalysisSchema = z.object({
  category: z.enum(['Important', 'To-Do', 'Newsletter', 'Spam', 'Uncategorized']),
  summary: z.string().describe("A natural, conversational summary of the email (as if spoken by a human assistant). No length limit."),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Urgent']).describe("The emotional tone or urgency of the email."),
  keyEntities: z.array(z.string()).describe("List of key people, organizations, or topics mentioned."),
  actionItems: z.array(z.object({
    task: z.string(),
    deadline: z.string().nullable().describe("ISO date string or null"),
    priority: z.enum(['High', 'Medium', 'Low']),
  })).describe("List of actionable tasks derived from the email"),
  // New Field for Psycho-Analysis
  senderProfile: z.object({
      archetype: z.string(),
      strategy: z.string()
  }).optional().describe("Brief psychological profile of sender")
});

export async function processEmail(emailId: string) {
    const email = db.getEmail(emailId);

    if (!email) {
      throw new Error('Email not found');
    }

    // 0. Check Store (Idempotency)
    if (email.analysis && email.category) {
      return email;
    }

    // 1. Check Cache (Performance)
    const cacheKey = aiCache.generateKey('process', { id: emailId, contentHash: email.body.length });
    const cachedResult = aiCache.get(cacheKey);
    if (cachedResult) {
        console.log(`⚡ Returning Cached Process Result for ${emailId}`);
        return db.updateEmail(emailId, cachedResult);
    }

    console.log(`🚀 Starting Intelligent Processing for ${emailId}...`);
    const startTime = Date.now();
    let finalResult;

    // ⚡ HYBRID APPROACH: Fast-Path + Accurate-Path
    const sender = email.sender.toLowerCase();
    const bodyText = email.body.toLowerCase();
    const subject = email.subject.toLowerCase();

    // --- FAST PATH (Milliseconds) ---
    let isFastPath = false;
    type EmailCategory = 'Important' | 'To-Do' | 'Newsletter' | 'Spam' | 'Uncategorized';
    let fastCategory: EmailCategory | null = null;

    if (sender.includes('newsletter') || bodyText.includes('unsubscribe') || bodyText.includes('view in browser')) {
        fastCategory = 'Newsletter';
        isFastPath = true;
    } else if (sender.includes('no-reply') || bodyText.includes('click here to claim')) {
        fastCategory = 'Spam';
        isFastPath = true;
    }

    if (isFastPath && fastCategory) {
        console.log(`⚡ Fast-Path detected: ${fastCategory}`);
        
        // Simple heuristic summary
        const summary = fastCategory === 'Newsletter' 
            ? `Newsletter from ${email.sender.split('@')[0]}.` 
            : `Promotional email from ${email.sender.split('@')[0]}.`;

        finalResult = {
            category: fastCategory,
            actionItems: [], // Usually no tasks in newsletters/spam
            summary: summary
        };
    } else {
        // --- ACCURATE PATH (Groq LPU) ---
        try {
            // ⚡ OPTIMIZATION: Use 'fast' mode (Llama 3.1 8B) for sub-second triage by default.
            // We only upgrade to 'smart' (70B) if strictly necessary or requested.
            // Llama 3.1 8B is incredibly capable for this task and 10x faster.
            console.log(`🧠 Invoking Groq Llama 3.1 (FAST_MODEL) for rapid analysis...`);
            
            // Optimized prompt for high-speed Groq inference
            const { object } = await resilientGenerateObject({
                mode: 'fast', // CHANGED: 'smart' -> 'fast' for <1s latency
                schema: AnalysisSchema,
                prompt: `
                    Analyze this email immediately.
                    
                    Sender: ${email.sender}
                    Subject: ${email.subject}
                    Body: "${email.body.substring(0, 6000)}"
                    
                    Output JSON only.
                    1. Category: Important, To-Do, Newsletter, Spam, or Uncategorized.
                    2. Summary: Write a natural, human-like summary. There is NO word limit. Focus on clarity and ease of understanding. It should sound like a helpful assistant briefing the user.
                    3. Sentiment: Detect tone.
                    4. KeyEntities: Extract important names.
                    5. ActionItems: strict list of tasks.
                    6. SenderProfile: Briefly analyze the sender's personality archetype (e.g. 'The Analyst') and 1 sentence strategy to reply.
                `,
                temperature: 0.1, 
            });
            
            const analysis = object as z.infer<typeof AnalysisSchema>;

            finalResult = {
                category: analysis.category,
                actionItems: analysis.actionItems,
                summary: analysis.summary,
                sentiment: analysis.sentiment,
                entities: analysis.keyEntities,
                senderProfile: analysis.senderProfile
            };
            
            // Enhance summary with sentiment if urgent
            if (analysis.sentiment === 'Urgent') {
                finalResult.summary = `[URGENT] ${finalResult.summary}`;
            }

        } catch (aiError: unknown) {
            console.error("⚠️ AI Generation Error:", aiError);
            
            // --- FALLBACK TO LOCAL NLP ---
            console.log("⚠️ Falling back to Basic NLP Engine.");
            
            let fallbackCategory: EmailCategory = 'Uncategorized';
            if (subject.includes('urgent')) fallbackCategory = 'Important';
            else if (bodyText.includes('please')) fallbackCategory = 'To-Do';

            // Improved Fallback Summary
            const safeSenderName = email.sender.split('@')[0].replace(/[0-9]/g, '') || "Sender";
            const fallbackSummary = `Received ${subject ? `"${subject}"` : 'an email'} from ${safeSenderName}. Contains ${email.body.split(' ').length} words.`;

            finalResult = {
                category: fallbackCategory,
                actionItems: [],
                summary: fallbackSummary
            };
        }
    }

    // Persist Entities (Simple extraction)
    const senderName = email.sender.split('@')[0].replace(/[0-9]/g, '');
    if (senderName.length > 2) db.addEntity(senderName, 'Person', emailId);

    // Save advanced entities if extracted
    if (finalResult.entities && Array.isArray(finalResult.entities)) {
        finalResult.entities.forEach((entity: string) => {
            if (entity.length > 3) db.addEntity(entity, 'Topic', emailId);
        });
    }

    // Cache the result
    aiCache.set(cacheKey, finalResult);

    // Update Store synchronously
    const updatedEmail = db.updateEmail(emailId, {
      category: finalResult.category,
      actionItems: finalResult.actionItems,
      analysis: finalResult.summary
    });

    console.log(`⚡ Process Complete in ${Date.now() - startTime}ms`);
    
    return updatedEmail;
}
