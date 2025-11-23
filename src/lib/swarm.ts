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
            
            GUIDELINES:
            1. No length limits. Write as much as needed to be effective.
            2. Stick to your persona strictly.
            3. Explain your reasoning.
        `
    });
    return result.object as z.infer<typeof SwarmSchema>;
}

export async function runSwarm(emailContext: string) {
    console.log("🐝 Releasing the Swarm...");
    
    // 1. Parallel Execution
    const [skeptic, optimist, strategist] = await Promise.all([
        runAgent("The Skeptic: Cautious, legalistic, protective. Detailed risk assessment.", emailContext),
        runAgent("The Optimist: Friendly, enthusiastic, sales-driven. Relationship building focus.", emailContext),
        runAgent("The Strategist: Efficient, data-driven, long-term thinker. Comprehensive planning.", emailContext)
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
            
            Email Context: ${emailContext.substring(0, 1000)}...
            
            Proposal 1 (Skeptic): ${skeptic.body} (Reason: ${skeptic.reasoning})
            Proposal 2 (Optimist): ${optimist.body} (Reason: ${optimist.reasoning})
            Proposal 3 (Strategist): ${strategist.body} (Reason: ${strategist.reasoning})
            
            TASK: Create the FINAL COMPREHENSIVE STRATEGIC DRAFT.
            
            GUIDELINES:
            1. Unrestricted Length: Do not limit yourself. Cover all necessary ground.
            2. Synthesis: Merge the best strategic points from all three proposals.
            3. Distinctiveness: This must NOT look like a generic rapid reply. It should feel researched and weighed.
            4. Structure: You can use bullet points or multiple paragraphs if helpful.
            
            Rationale: Explain exactly why this synthesized version is superior.
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
