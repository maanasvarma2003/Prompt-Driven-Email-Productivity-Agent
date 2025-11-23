import { z } from 'zod';
import { resilientGenerateObject, SMART_MODEL } from './resilient';
import { groq } from './groq';

const AutonomyActionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['Financial', 'Scheduling', 'Communication', 'Legal']),
  description: z.string(),
  status: z.enum(['Completed', 'Pending', 'Requires Approval']),
  moneySaved: z.number().optional(),
});

export type AutonomyAction = z.infer<typeof AutonomyActionSchema>;

const AutonomyDecisionSchema = z.object({
  actions: z.array(AutonomyActionSchema),
});

export async function runAutopilotCheck(
  digitalDNA: string, // User's preferences/risk profile
  recentEvents: string[] // Mocked events (e.g., "Bill arrived", "Invite received")
): Promise<AutonomyAction[]> {
  console.log('🧬 [Autopilot] Analyzing life admin tasks...');

  const prompt = `
    ACT AS A 'LEVEL 5' AUTONOMOUS AGENT (DIGITAL TWIN).
    
    Your Digital DNA (User Profile): "${digitalDNA}"
    
    Incoming Events/Triggers:
    ${recentEvents.map(e => `- ${e}`).join('\n')}

    Task:
    Decide how to handle these events automatically based on the Digital DNA.
    If the user is risk-averse, ask for approval.
    If the user trusts you with small finance (<$50), just do it.
    
    Generate a log of actions taken.
  `;

  try {
    const { object } = await resilientGenerateObject({
      model: groq(SMART_MODEL),
      schema: AutonomyDecisionSchema,
      mode: 'smart',
      prompt: prompt,
    });
    
    // Explicitly cast object to the inferred schema type to avoid 'unknown' error
    const typedObject = object as z.infer<typeof AutonomyDecisionSchema>;

    return typedObject.actions;
  } catch (error) {
    console.error('Autopilot Failed:', error);
    return [];
  }
}
