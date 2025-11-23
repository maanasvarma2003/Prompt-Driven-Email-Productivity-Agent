import { resilientGenerateObject } from './resilient';
import { z } from 'zod';

const PsychologySchema = z.object({
  personalityType: z.string().describe("Estimated MBTI or simple archetype (e.g., 'The Analyst', 'The Visionary', 'The Skeptic')."),
  communicationStyle: z.string().describe("How they communicate (e.g., 'Direct & Terse', 'Warm & Chatty')."),
  negotiationTactics: z.array(z.string()).describe("Any detected persuasion or negotiation tactics used."),
  recommendedStrategy: z.string().describe("Expert advice on how to reply to influence this specific person."),
  emotionalState: z.string().describe("Current detected mood (e.g. 'Anxious', 'Excited', 'Frustrated').")
});

export async function analyzePsychology(emailBody: string, sender: string) {
  try {
    console.log(`🧠 Running Neuro-Linguistic Profiling on ${sender}...`);
    
    const { object } = await resilientGenerateObject({
      mode: 'smart', // Requires high intelligence model
      schema: PsychologySchema,
      prompt: `
        Act as an FBI Behavioral Analyst and Expert Psychologist.
        
        Analyze the following email text from "${sender}".
        Decode the sender's psychological profile, underlying motivations, and emotional state based on their word choice, sentence structure, and tone.
        
        Email Body:
        "${emailBody.substring(0, 5000)}"
        
        Provide a strategic assessment of how to communicate with this person effectively.
      `,
      temperature: 0.2 // Deterministic analysis
    });

    return object;

  } catch (error) {
    console.error("Psych profiling failed:", error);
    return null;
  }
}





