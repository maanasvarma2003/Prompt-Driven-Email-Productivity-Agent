import { db } from '@/lib/store';
import { aiCache } from '@/lib/cache';
import { resilientGenerateObject } from '@/lib/resilient';
import { z } from 'zod';
import nlp from 'compromise';

// Schema for LLM analysis
const AnalysisSchema = z.object({
  category: z.enum(['Important', 'To-Do', 'Newsletter', 'Spam', 'Uncategorized']),
  // Priority Matrix Classification (Eisenhower)
  priorityMatrix: z.enum(['Do First', 'Schedule', 'Delegate', 'Delete']).describe("Eisenhower Matrix quadrant based on urgency and importance."),
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
    if (email.analysis && email.category && email.priorityMatrix) {
      return email;
    }
    // ...
    // --- FAST PATH (Milliseconds) ---
    let isFastPath = false;
    let fastCategory: any = null;
    let fastMatrix: any = null;

    if (sender.includes('newsletter') || bodyText.includes('unsubscribe') || bodyText.includes('view in browser')) {
        fastCategory = 'Newsletter';
        fastMatrix = 'Delete';
        isFastPath = true;
    } else if (sender.includes('no-reply') || bodyText.includes('click here to claim')) {
        fastCategory = 'Spam';
        fastMatrix = 'Delete';
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
            priorityMatrix: fastMatrix,
            actionItems: [], // Usually no tasks in newsletters/spam
            summary: summary
        };
    } else {
        // --- ACCURATE PATH (Groq LPU) ---
        try {
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
                    2. PriorityMatrix: 'Do First' (Urgent+Important), 'Schedule' (Important-NotUrgent), 'Delegate' (Urgent-NotImportant), 'Delete' (Neither).
                    3. Summary: Write a simple, human-like summary. No word limit, just make it easy to understand. Speak naturally.
                    4. Sentiment: Detect tone.
                    5. KeyEntities: Extract important names.
                    6. ActionItems: strict list of tasks.
                    7. SenderProfile: Briefly analyze the sender's personality archetype (e.g. 'The Analyst') and 1 sentence strategy to reply.
                `,
                temperature: 0.1, 
            });
            
            const analysis = object as z.infer<typeof AnalysisSchema>;

            finalResult = {
                category: analysis.category,
                priorityMatrix: analysis.priorityMatrix,
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

        } catch (aiError: any) {
            console.error("⚠️ AI Generation Error:", aiError);
            
            // --- FALLBACK TO LOCAL NLP ---
            console.log("⚠️ Falling back to Basic NLP Engine.");
            
            let fallbackCategory = 'Uncategorized';
            let fallbackMatrix = 'Schedule';
            if (subject.includes('urgent')) { fallbackCategory = 'Important'; fallbackMatrix = 'Do First'; }
            else if (bodyText.includes('please')) fallbackCategory = 'To-Do';

            // Improved Fallback Summary
            const safeSenderName = email.sender.split('@')[0].replace(/[0-9]/g, '') || "Sender";
            const fallbackSummary = `Received ${subject ? `"${subject}"` : 'an email'} from ${safeSenderName}. Contains ${email.body.split(' ').length} words.`;

            finalResult = {
                category: fallbackCategory,
                priorityMatrix: fallbackMatrix,
                actionItems: [],
                summary: fallbackSummary
            };
        }
    }
    // ...
    // Update Store synchronously
    const updatedEmail = db.updateEmail(emailId, {
      category: finalResult.category,
      priorityMatrix: finalResult.priorityMatrix,
      actionItems: finalResult.actionItems,
      analysis: finalResult.summary,
      sentiment: finalResult.sentiment,
      senderProfile: finalResult.senderProfile,
      entities: finalResult.entities
    });
    
    // --- 7. MEMORY CORE INDEXING ---
    // Index this email into the vector store for future RAG
    if (finalResult.summary) {
        db.addToMemory(emailId, `Sender: ${email.sender}. Subject: ${email.subject}. Summary: ${finalResult.summary}`);
    }

    console.log(`⚡ Process Complete in ${Date.now() - startTime}ms`);
    
    return updatedEmail;
}
