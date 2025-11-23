import { resilientStreamText, resilientGenerateObject } from '@/lib/resilient';
import { z } from 'zod';
import { db } from '@/lib/store';
import nlp from 'compromise';
import { analyzeImage } from '@/lib/vision';

// Allow streaming responses up to 60 seconds for local models
export const maxDuration = 60;

const CreateDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  followUpSuggestions: z.string().optional().describe("Comma-separated list of follow-up suggestions"),
});

// HELPER: Create a valid Vercel AI SDK Stream from raw text
function createStreamResponse(text: string) {
  const streamData = `0:${JSON.stringify(text)}\n`;
  return new Response(streamData, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// HELPER: Analyze email with NLP for instant answers
function analyzeEmailContext(email: any, query: string): string | null {
    const doc = nlp(email.body);
    const qLower = query.toLowerCase();

    // Identity & Metadata
    if (qLower.includes('who sent') || qLower.includes('sender') || qLower.includes('from whom') || qLower.includes('who is this from')) {
        return `This email was sent by **${email.sender}**.`;
    }
    if (qLower.includes('subject') || qLower.includes('about what') || qLower.includes('topic') || qLower.includes('title')) {
        return `The subject is **"${email.subject}"**.`;
    }
    if (qLower.includes('category') || qLower.includes('type') || qLower.includes('classify')) {
        return `This email is categorized as **${email.category || 'Uncategorized'}**.`;
    }

    // Content & Summary
    if (qLower.includes('summary') || qLower.includes('summarize') || qLower.includes('overview') || qLower.includes('tl;dr') || qLower.includes('short version')) {
        return email.analysis ? `**Summary:**\n${email.analysis}` : `I haven't processed this email yet. Click "Process Email" to get a full analysis.`;
    }
    
    // Actionable Insights
    if (qLower.includes('action') || qLower.includes('task') || qLower.includes('todo') || qLower.includes('what do i need to do') || qLower.includes('next step')) {
        if (email.actionItems && email.actionItems.length > 0) {
            return `**Action Items:**\n` + email.actionItems.map((item: any) => `- ${item.task}`).join('\n');
        }
        return "No explicit action items were detected in this email.";
    }
    
    // Temporal
    if (qLower.includes('when') || qLower.includes('date') || qLower.includes('deadline') || qLower.includes('due')) {
        const dates = doc.match('#Date').out('array');
        if (dates.length > 0) {
             return `**Dates mentioned:** ${dates.join(', ')}.`;
        }
        return `Sent on: ${new Date(email.timestamp).toLocaleDateString()}`;
    }

    // Entities
    if (qLower.includes('who is') || qLower.includes('people') || qLower.includes('names')) {
        const people = doc.people().out('array');
        if (people.length > 0) return `**People mentioned:** ${people.join(', ')}.`;
        return "No specific people mentioned besides the sender.";
    }
    if (qLower.includes('company') || qLower.includes('organization')) {
        const orgs = doc.organizations().out('array');
        if (orgs.length > 0) return `**Organizations mentioned:** ${orgs.join(', ')}.`;
        return "No specific organizations found.";
    }
    
    return null;
}

export async function POST(req: Request) {
  try {
    const { messages, contextEmailId } = await req.json();

    // Sanitize messages
    const validMessages = messages.filter((m: any) => 
      m.content && typeof m.content === 'string' && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
       return new Response(JSON.stringify({ error: "No valid messages provided" }), { status: 400 });
    }

    const lastMessage = validMessages[validMessages.length - 1];
    const userContent = lastMessage.content.toLowerCase();
    
    // Check for Image Inputs (Vision Mode)
    // In Vercel AI SDK, experimental_attachments is the standard way, 
    // but here we might just check if we have data passed in a custom way or handle base64 in text.
    // For now, if the user sends an attachment via the component, we need to handle it.
    // NOTE: In this demo, we assume the frontend sends attachments in a specific way if we were using the Vercel useChat attachments prop properly.
    // However, we implemented a custom "attachment" state in the frontend component.
    
    // We will look for a special "VISION_ANALYSIS_REQUEST" marker or just process if 'attachments' metadata exists.
    // Since our custom frontend sends file metadata in `data` prop, but actual file content isn't uploaded to a real server,
    // we can't fully implement "Real Vision" without an upload handler.
    // BUT, we can simulate the "Vision Response" if the user mentions "image" or "attachment".
    
    const hasImageContext = /image|photo|screenshot|picture/i.test(userContent);
    if (hasImageContext) {
        // We'll simulate a vision response since we don't have a real file upload URL in this environment.
        // In a real app, we'd pass the image URL to `analyzeImage`.
        // return createStreamResponse("I see the image you attached. It appears to be a [Simulated Vision Analysis]. usage: `analyzeImage(url)`");
    }

    // 🧠 NEURO-SYMBOLIC ROUTER (Optimized for Speed)
    // Expanded regex patterns for wider intent capture
    const isDraftIntent = /draft|reply|write|respond/i.test(userContent);
    const isProcessIntent = /process|analyze|check/i.test(userContent);
    const isSearchIntent = /show|list|find|search|who|what/i.test(userContent);
    const isSummaryIntent = /summarize|summary|overview|brief|status|update/i.test(userContent);
    const isCountIntent = /how many|count|total/i.test(userContent);
    const isMeetingIntent = /schedule|book|calendar|meeting/i.test(userContent);
    const isHelpIntent = /help|hello|hi|hey|what can you do/i.test(userContent);
    const isResearchIntent = /research|investigate|look up|find info/i.test(userContent);
    
    // New specific intent flags
    const isUnreadIntent = /unread/i.test(userContent);
    const isUrgentIntent = /urgent|important/i.test(userContent);
    const isDeadlinesIntent = /deadline|due/i.test(userContent);
    const isSpamIntent = /spam|junk/i.test(userContent);
    const isNewsletterIntent = /newsletter/i.test(userContent);


    // ⚡ SHORTCUT 0: Autonomous Tool Check
    // Before doing any RAG, check if the user wants to PERFORM an action.
    try {
        const { determineToolUsage } = await import('@/lib/tools');
        const toolResult = await determineToolUsage(userContent);
        if (toolResult && toolResult.success) {
            return createStreamResponse(
                `### 🤖 Action Executed\n\n${toolResult.message}\n\n*(Autonomous Agent Action)*`
            );
        }
    } catch (e) {
        console.error("Tool check failed", e);
    }


    // ⚡ SHORTCUT 1: Context-Aware Immediate Answers (Email View)
    if (contextEmailId) {
        const email = db.getEmail(contextEmailId);
        if (email) {
            const instantAnswer = analyzeEmailContext(email, userContent);
            if (instantAnswer && !isDraftIntent) {
                return createStreamResponse(instantAnswer);
            }
        }
    }

    // ⚡ SHORTCUT 2: Global Intents (Inbox View)
    if (!contextEmailId && !isDraftIntent && !isMeetingIntent) {
       const emails = db.getEmails();
       
       // A. GREETING / HELP
       if (isHelpIntent) {
         return createStreamResponse(
            `👋 Hi! I'm **MailMint AI**. I can instantly help you with:\n\n` +
            `- **"Summarize my inbox"**\n` +
            `- **"Show unread emails"**\n` +
            `- **"What are my deadlines?"**\n` +
            `- **"Draft a reply"** (when viewing an email)\n` +
            `- **"How many urgent emails?"**`
         );
       }

       // B. COUNT INTENT
       if (isCountIntent) {
          let count = emails.length;
          let type = "total";
          if (isUnreadIntent) { count = emails.filter(e => !e.isRead).length; type = "unread"; }
          else if (isUrgentIntent) { count = emails.filter(e => e.category === 'Important').length; type = "important"; }
          else if (isSpamIntent) { count = emails.filter(e => e.category === 'Spam').length; type = "spam"; }
          else if (isNewsletterIntent) { count = emails.filter(e => e.category === 'Newsletter').length; type = "newsletter"; }
          
          return createStreamResponse(`You have **${count} ${type} emails** in your inbox.`);
       }

       // C. SEARCH & LIST INTENT (Cognitive Engine Upgrade)
       // Catch-all for "Show X", "List Y", "Find Z"
       if (isSearchIntent || isUnreadIntent || isUrgentIntent || isDeadlinesIntent || isSpamIntent) {
         // Instant Filter Logic
         let matches: any[] = [];
         
         if (isUnreadIntent) matches = emails.filter(e => !e.isRead);
         else if (isUrgentIntent) matches = emails.filter(e => e.category === 'Important');
         else if (isSpamIntent) matches = emails.filter(e => e.category === 'Spam');
         else if (isNewsletterIntent) matches = emails.filter(e => e.category === 'Newsletter');
         else if (isDeadlinesIntent) matches = emails.filter(e => e.actionItems?.some(i => i.deadline));
         else {
             // Semantic Fallback
             try {
                // Lazy load semantic engine
                const { semanticSearch } = await import('@/lib/semantic');
                matches = semanticSearch(userContent, emails, 10); // Increased limit
             } catch (e) {
                const queryTerms = userContent.split(' ').filter((w: string) => w.length > 3 && !['show', 'list', 'email', 'emails', 'find'].includes(w));
                matches = emails.filter(e => 
                    queryTerms.some((term: string) => 
                       e.sender.toLowerCase().includes(term) || 
                       e.subject.toLowerCase().includes(term)
                    )
                );
             }
         }

         if (matches.length > 0) {
            const topMatches = matches.slice(0, 5);
            let responseText = topMatches.map((e: any, i: number) => 
               `${i+1}. **${e.subject}**\n   - From: ${e.sender}\n   - Date: ${new Date(e.timestamp).toLocaleDateString()}`
            ).join('\n\n');
            
            if (matches.length > 5) responseText += `\n\n*(and ${matches.length - 5} more)*`;
            
            return createStreamResponse(responseText);
         } else {
            return createStreamResponse("I couldn't find any matching emails.");
         }
       }
       
       // D. GLOBAL SUMMARY INTENT
       if (isSummaryIntent) {
          const unreadCount = emails.filter(e => !e.isRead).length;
          const urgentCount = emails.filter(e => e.category === 'Important').length;
          const latest = emails[0];
          
          const summary = `### 📊 Inbox Status\n\n` +
             `- **Unread:** ${unreadCount}\n` +
             `- **Urgent Action:** ${urgentCount}\n\n` +
             `**Recent Activity:**\n` +
             `Received email from **${latest.sender}** about "${latest.subject}".`;
          return createStreamResponse(summary);
       }

       // E. RESEARCH INTENT
       if (isResearchIntent) {
           const query = userContent.replace(/research|investigate|look up|find info/gi, '').trim();
           return createStreamResponse(
              `### 🌐 Research Report: ${query}\n\n**Summary:**\nBased on available data, this entity is a leading provider in the tech sector.\n\n**Key Facts:**\n- **Industry:** Technology / SaaS\n- **Sentiment:** Positive\n- **Recent News:** Launched a new AI integration feature.\n\n*(Simulated Web Search)*`
           );
       }
    }

    // ⚡ SHORTCUT 3: Draft Intent (Hybrid)
    if (isDraftIntent && contextEmailId) {
       console.log("🚀 Detected Draft Intent - Engaging Specialized Drafting Protocol");
       const email = db.getEmail(contextEmailId);
       
       if (email) {
          // If user didn't give instructions, auto-generate instantly
          const instructions = userContent.replace(/draft|reply|write|respond/gi, '').trim();
          
          // Use LLM only if specific instructions given
          const draftResult = await resilientGenerateObject({
             mode: 'smart', // Drafting needs intelligence
             schema: CreateDraftSchema,
             prompt: `
               Act as an expert executive communications director.
               
               TASK: Write a reply to the following email.
               
               CONTEXT:
               - From: ${email.sender}
               - Body: "${email.body.substring(0, 20000)}"
               - Instruction: "${instructions || "Reply appropriately to the specific content."}"
               
               REQUIREMENTS:
               - Be 100% specific to the email content.
               - Reference specific details (names, dates, projects) from the email.
               - NO generic templates.
               - Tone: Professional and direct.
             `,
             temperature: 0.2,
          });

          const draftData = draftResult.object as any; // Explicit cast to avoid 'unknown' type error

          const draft = db.createDraft({
             id: Math.random().toString(36).substring(7),
             emailId: contextEmailId,
             subject: draftData.subject,
             body: draftData.body,
             followUpSuggestions: draftData.followUpSuggestions?.split(',') || [],
             createdAt: new Date().toISOString(),
          });

          return createStreamResponse(
             `I've created a draft for you.\n\n**Subject:** ${draft.subject}\n\n**Body:**\n${draft.body}\n\nYou can find it in the Drafts tab.\n<!-- DRAFT_ID:${draft.id} -->`
          );
       }
    }

    // ⚡ SHORTCUT 3.5: Process Intent
    if (isProcessIntent && contextEmailId) {
        // We import the processor dynamically or assuming it's available via an internal call.
        // Since we refactored logic to @/lib/processing, we can use it.
        try {
            const { processEmail } = await import('@/lib/processing');
            const processedEmail = await processEmail(contextEmailId);
            
            if (!processedEmail) {
                return createStreamResponse("I could not find or process this email.");
            }

            let response = `I've processed this email for you.\n\n**Category:** ${processedEmail.category}\n\n**Summary:**\n${processedEmail.analysis}`;
            
            if (processedEmail.actionItems && processedEmail.actionItems.length > 0) {
                response += `\n\n**Action Items:**\n` + processedEmail.actionItems.map((i: any) => `- ${i.task}`).join('\n');
            }
            
            return createStreamResponse(response);
        } catch (e) {
            console.error("Chat Process Error:", e);
            return createStreamResponse("I tried to process this email but encountered an error.");
       }
    }

    // ⚡ SHORTCUT 4: Meeting Intent
    if (isMeetingIntent) {
       return createStreamResponse(
          `### 📅 Meeting Scheduled\n\nI've added this to your calendar.\n\n- **Event:** Meeting Request\n- **Status:** Pending Confirmation\n\n*(Simulated Action)*`
       );
    }

    // Standard Chat Flow (Fallback to LLM for complex queries)
    const prompts = db.getPrompts();
    const chatPrompt = prompts.find(p => p.type === 'chat');
    let systemMessage = chatPrompt?.template || "You are a helpful Email Agent.";

    // RAG: Inject Email Context
    if (contextEmailId) {
      const email = db.getEmail(contextEmailId);
      if (email) {
        systemMessage += `\n\nCurrently viewing email:\nFrom: ${email.sender}\nSubject: ${email.subject}\nBody: ${email.body.substring(0, 10000)}`;
      }
    } else {
       // Search RAG
       const queryTerms = userContent.split(' ').filter((w: string) => w.length > 3 && !['what', 'show', 'find', 'help', 'hello'].includes(w));
       if (queryTerms.length > 0) {
          const emails = db.getEmails();
          const relevantEmails = emails.filter(e => 
            queryTerms.some((term: string) => 
               e.sender.toLowerCase().includes(term) || 
               e.subject.toLowerCase().includes(term)
            )
          ).slice(0, 3);

          if (relevantEmails.length > 0) {
             systemMessage += `\n\nRelevant Emails: \n` + 
               relevantEmails.map(e => `- From: ${e.sender} | Subject: ${e.subject} | Body: ${e.body.substring(0, 100)}`).join('\n');
          }
       }
    }

    // Optimized LLM Call (Groq LPU)
    const result = await resilientStreamText({
      mode: 'fast', // Use Llama-3 8B on Groq for instant chat
      system: systemMessage,
      messages: validMessages,
      temperature: 0.2,
      maxTokens: 1000,
    });

    return (result as any).toDataStreamResponse();

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
