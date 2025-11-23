import { z } from 'zod';
import { resilientGenerateObject } from './resilient';
import { SMART_MODEL, FAST_MODEL } from './groq';

// --- Types ---
export type AgentRole = 'researcher' | 'scheduler' | 'critic' | 'drafter';

const AgentResponseSchema = z.object({
  thought: z.string().describe("Internal reasoning process"),
  output: z.string().describe("The final output for this step"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  issues: z.array(z.string()).optional().describe("List of issues found (for Critic)"),
});

// --- Prompts ---
const PROMPTS = {
  researcher: `You are the Research Agent. Your job is to verify facts and gather necessary context.
    Analyze the incoming email request. If it mentions specific companies, dates, or technical terms, explain them briefly.
    If no research is needed, state "No research required."`,
    
  scheduler: `You are the Schedule Agent. Your job is to handle time and dates.
    Check the request for meeting proposals. Propose 3 specific slots based on standard business hours (Mon-Fri, 9-5).
    If no scheduling is needed, state "No scheduling required."`,

  critic: `You are the Critic Agent. Your job is to review the draft for quality, tone, and accuracy.
    Check for:
    1. Tone consistency (Professional yet warm).
    2. Missing attachments references (if user asked to attach something).
    3. Clarity and brevity.
    If the draft is perfect, say "Approved". Otherwise, list specific improvements.`,
};

// --- Orchestrator ---
export async function runSwarmAgent(
  role: AgentRole, 
  context: string, 
  prevOutput?: string
) {
  const prompt = PROMPTS[role as keyof typeof PROMPTS] || "You are a helpful assistant.";
  const fullContext = `CONTEXT:\n${context}\n\nPREVIOUS OUTPUT:\n${prevOutput || "None"}`;

  try {
    const { object } = await resilientGenerateObject({
      mode: 'fast', // Use fast model for sub-agents to keep latency low
      schema: AgentResponseSchema,
      prompt: `${prompt}\n\n${fullContext}`,
      temperature: 0.2,
    });
    return object;
  } catch (error) {
    console.error(`Swarm Agent (${role}) failed:`, error);
    return { thought: "Error", output: "", confidence: 0 };
  }
}

// --- Main Pipeline ---
export async function generateSwarmDraft(emailBody: string, userInstruction: string) {
  // Parallel Execution: Research & Schedule
  const [research, schedule] = await Promise.all([
    runSwarmAgent('researcher', `Email: ${emailBody}\nInstruction: ${userInstruction}`),
    runSwarmAgent('scheduler', `Email: ${emailBody}\nInstruction: ${userInstruction}`),
  ]);

  // Context Assembly
  const augmentedContext = `
    ORIGINAL EMAIL:
    ${emailBody}

    USER INSTRUCTION:
    ${userInstruction}

    RESEARCH NOTES:
    ${research.output}

    SCHEDULING OPTIONS:
    ${schedule.output}
  `;

  // Drafting (Main Agent)
  // We use the existing draft logic but pass this augmented context.
  return augmentedContext;
}

