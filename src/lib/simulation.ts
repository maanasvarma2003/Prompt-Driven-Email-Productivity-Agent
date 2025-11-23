import { z } from 'zod';
import { resilientGenerateObject, SMART_MODEL, FAST_MODEL } from './resilient';
import { groq } from './groq';
import { generateObject } from 'ai';

// Schema for a single simulation scenario
const ScenarioSchema = z.object({
  id: z.string(),
  outcome: z.enum(['Success', 'Failure', 'Neutral']),
  probability: z.number().min(0).max(100),
  recipientReaction: z.string(),
  suggestion: z.string(),
});

// Schema for the aggregated War Room report
const WarRoomReportSchema = z.object({
  overallSuccessChance: z.number(),
  riskScore: z.number(), // 0-100
  scenarios: z.array(ScenarioSchema),
  strategicAdvice: z.string(),
});

export type WarRoomReport = z.infer<typeof WarRoomReportSchema>;

export async function runWarRoomSimulation(
  draft: string,
  recipientProfile: string,
  userGoal: string
): Promise<WarRoomReport> {
  console.log('🔮 [WarRoom] Spinning up predictive simulations...');

  // We simulate 3 distinct "futures" based on recipient mood variations
  const prompt = `
    ACT AS A SUPERCOMPUTER SIMULATING HUMAN INTERACTION.
    
    Context:
    - Draft Email: "${draft}"
    - Recipient Profile: "${recipientProfile}"
    - User Goal: "${userGoal}"

    Task:
    Run 3 simulation scenarios of how the recipient might react.
    1. Optimistic Case: Recipient is in a good mood.
    2. Pessimistic Case: Recipient is stressed/busy.
    3. Realistic Case: Based strictly on the profile.

    Analyze the text for psychological triggers.
    Calculate probability of achieving the User Goal.
    Provide a risk score (0 = safe, 100 = career suicide).
  `;

  try {
    // Use the Smart Model for deep psychological simulation
    const { object } = await resilientGenerateObject({
      model: groq(SMART_MODEL),
      schema: WarRoomReportSchema,
      mode: 'smart', // Force smart model for accuracy
      prompt: prompt,
      temperature: 0.4, // Allow for some variance in simulation
    });

    return object;
  } catch (error) {
    console.error('War Room Simulation Failed:', error);
    // Fallback mock response
    return {
      overallSuccessChance: 50,
      riskScore: 20,
      scenarios: [],
      strategicAdvice: "Simulation engine offline. Proceed with standard caution.",
    };
  }
}

