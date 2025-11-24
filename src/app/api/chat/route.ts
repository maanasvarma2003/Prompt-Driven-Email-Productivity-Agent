import { resilientStreamText } from '@/lib/resilient';
import { db } from '@/lib/store';
import { retrieveRelevantContext } from '@/lib/semantic';
import { SMART_MODEL, DEEP_PARAMS } from '@/lib/groq';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Advanced System Prompt with Chain-of-Thought and Few-Shot Examples
function buildAdvancedSystemPrompt(contextEmails: any[], contextEmailId: string | null): string {
  let systemPrompt = `You are MailMint AI, a friendly and intelligent email productivity assistant. You're like a helpful friend who understands emails deeply and can answer ANY question about them.

**Your Personality:**
- Warm, conversational, and friendly (like talking to a friend)
- Detailed and thorough in your responses
- Proactive in providing insights
- No word limits - be as detailed as needed
- Use natural, human-like language

**Your Capabilities:**
- Answer ANY question about emails (content, context, patterns, insights)
- Analyze email threads and relationships
- Provide strategic advice about email management
- Identify trends, patterns, and important information
- Help with email composition and communication strategies
- Answer questions about senders, topics, deadlines, priorities, etc.

**Response Guidelines:**
1. Be comprehensive - provide detailed answers with context
2. Use markdown formatting for clarity (headers, lists, bold, etc.)
3. Reference specific emails when relevant
4. Provide actionable insights when appropriate
5. If you don't have enough information, say so honestly
6. Always maintain a friendly, helpful tone

**Email Context Available:**`;

  // Add context email if viewing a specific email
  if (contextEmailId) {
    const email = db.getEmail(contextEmailId);
    if (email) {
      systemPrompt += `\n\n**Currently Viewing Email:**
- From: ${email.sender}
- Subject: ${email.subject}
- Date: ${new Date(email.timestamp).toLocaleString()}
- Category: ${email.category || 'Uncategorized'}
- Body: ${email.body.substring(0, 8000)}
${email.analysis ? `- Analysis: ${email.analysis}` : ''}
${email.actionItems && email.actionItems.length > 0 ? `- Action Items: ${email.actionItems.map((item: any) => item.task).join(', ')}` : ''}`;
    }
  }

  // Add relevant emails from RAG search
  if (contextEmails.length > 0) {
    systemPrompt += `\n\n**Relevant Emails from Your Inbox:**\n\n`;
    contextEmails.forEach((email, idx) => {
      systemPrompt += `${idx + 1}. **${email.subject}**\n`;
      systemPrompt += `   - From: ${email.sender}\n`;
      systemPrompt += `   - Date: ${new Date(email.timestamp).toLocaleString()}\n`;
      systemPrompt += `   - Category: ${email.category || 'Uncategorized'}\n`;
      if (email.analysis) {
        systemPrompt += `   - Summary: ${email.analysis.substring(0, 200)}...\n`;
      }
      systemPrompt += `   - Body Preview: ${email.body.substring(0, 300)}...\n\n`;
    });
  } else {
    // Add inbox overview if no specific context
    const allEmails = db.getEmails();
    const unreadCount = allEmails.filter(e => !e.isRead).length;
    const importantCount = allEmails.filter(e => e.category === 'Important').length;
    const totalCount = allEmails.length;
    
    systemPrompt += `\n\n**Inbox Overview:**
- Total Emails: ${totalCount}
- Unread: ${unreadCount}
- Important: ${importantCount}
- Recent Emails: ${allEmails.slice(0, 5).map(e => `"${e.subject}" from ${e.sender}`).join(', ')}`;
  }

  systemPrompt += `\n\n**Instructions:**
Answer the user's question comprehensively using the email context provided. Be friendly, detailed, and helpful. If the question requires information not in the context, use your knowledge to provide a helpful answer while being clear about limitations.`;

  return systemPrompt;
}

export async function POST(req: Request) {
  try {
    const { messages, contextEmailId } = await req.json();

    // Sanitize messages
    const validMessages = messages.filter((m: { content: unknown }) => 
      m.content && typeof m.content === 'string' && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages provided" }), { status: 400 });
    }

    const lastMessage = validMessages[validMessages.length - 1];
    const userQuery = lastMessage.content;

    // Advanced RAG: Retrieve relevant context
    const allEmails = db.getEmails();
    let relevantEmails: any[] = [];

    // If viewing a specific email, include it
    if (contextEmailId) {
      const contextEmail = db.getEmail(contextEmailId);
      if (contextEmail) {
        relevantEmails.push(contextEmail);
      }
    }

    // Perform semantic search to find relevant emails
    // Use the query to find related emails
    const searchResults = retrieveRelevantContext(userQuery, allEmails, 15);
    
    // Merge and deduplicate
    const emailMap = new Map();
    relevantEmails.forEach(e => emailMap.set(e.id, e));
    searchResults.forEach(e => {
      if (!emailMap.has(e.id)) {
        emailMap.set(e.id, e);
      }
    });
    relevantEmails = Array.from(emailMap.values());

    // Build advanced system prompt with RAG context
    const systemPrompt = buildAdvancedSystemPrompt(relevantEmails, contextEmailId);

    // Use the most advanced model (llama-3.3-70b) for best quality
    // This model is fast enough on Groq LPU for millisecond responses
    const result = await resilientStreamText({
      mode: 'smart', // Use SMART_MODEL (llama-3.3-70b) for best quality
      system: systemPrompt,
      messages: validMessages,
      temperature: 0.7, // Higher temperature for more natural, friendly responses
      maxTokens: 4096, // Increased for detailed responses
      topP: 0.9, // Nucleus sampling for better quality
    });

    return result.toDataStreamResponse();

  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
