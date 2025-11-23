import { resilientGenerateObject } from './resilient';
import { z } from 'zod';
import { groq } from './groq';
import { FAST_MODEL, SMART_MODEL } from './ai';

// --- AGENT SWARM INTELLIGENCE ---
// Three specialized agents debate the best reply.

const SwarmSchema = z.object({
  subject: z.string(),
  body: z.string(),
  reasoning: z.string()
});

async function runAgent(persona: string, emailContext: string) {
    const result = await resilientGenerateObject({
        mode: 'fast', // Use fast models for the individual swarm members
        schema: SwarmSchema,
        prompt: `
            You are an AI Agent with the persona: "${persona}".
            
            TASK: Draft a reply to this email.
            CONTEXT: ${emailContext}
            
            Explain your reasoning briefly.
        `
    });
    return result.object as z.infer<typeof SwarmSchema>;
}

export async function runSwarm(emailContext: string) {
    console.log("🐝 Releasing the Swarm...");
    
    // 1. Parallel Execution
    const [skeptic, optimist, strategist] = await Promise.all([
        runAgent("The Skeptic: Cautious, legalistic, protective. Asks for clarification.", emailContext),
        runAgent("The Optimist: Friendly, enthusiastic, sales-driven. Says yes.", emailContext),
        runAgent("The Strategist: Efficient, data-driven, long-term thinker.", emailContext)
    ]);

    console.log("🐝 Swarm Generated 3 Candidates.");

    // 2. The Judge (Synthesis)
    console.log("👨‍⚖️ The Judge is deliberating...");
    const { object } = await resilientGenerateObject({
        mode: 'smart', // Judge needs high intelligence
        schema: z.object({
            finalSubject: z.string(),
            finalBody: z.string(),
            rationale: z.string().describe("Why this is the best combination.")
        }),
        prompt: `
            You are the Chief of Staff. Three of your specialized agents have proposed replies to an email.
            
            Email Context: ${emailContext.substring(0, 500)}...
            
            Proposal 1 (Skeptic): ${skeptic.body} (Reason: ${skeptic.reasoning})
            Proposal 2 (Optimist): ${optimist.body} (Reason: ${optimist.reasoning})
            Proposal 3 (Strategist): ${strategist.body} (Reason: ${strategist.reasoning})
            
            TASK: Create the FINAL PERFECT DRAFT.
            - You may choose one winner OR merge the best parts of all three.
            - Ensure tone is professional and balanced.
        `
    });

    const verdict = object as { finalSubject: string; finalBody: string; rationale: string };

    return {
        subject: verdict.finalSubject,
        body: verdict.finalBody,
        swarmAnalysis: `
            🛡️ Skeptic: ${skeptic.reasoning}
            🌟 Optimist: ${optimist.reasoning}
            ♟️ Strategist: ${strategist.reasoning}
            
            🏆 Verdict: ${verdict.rationale}
        `
    };
}

