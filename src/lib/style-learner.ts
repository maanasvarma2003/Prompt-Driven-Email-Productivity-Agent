import { resilientGenerateObject } from './resilient';
import { z } from 'zod';
import { SentEmail } from '@/types';

// --- PERSONALIZED VOICE LEARNER ---
// Analyzes "Sent" folder to create a fine-tuned style profile.

export async function learnUserVoice(sentEmails: SentEmail[]) {
    if (sentEmails.length < 3) return "Professional, concise, standard business tone.";

    // Sample last 10 emails
    const samples = sentEmails.slice(-10).map(e => `Subject: ${e.subject}\nBody: ${e.body}`).join('\n---\n');

    try {
        console.log("🎤 Analyzing user voice...");
        const { object } = await resilientGenerateObject({
            mode: 'smart',
            schema: z.object({
                styleProfile: z.string().describe("A detailed prompt description of the user's writing style."),
                signature: z.string().describe("The user's typical sign-off."),
                tone: z.string()
            }),
            prompt: `
                Analyze these sent emails to create a "Style Profile" for the user.
                Identify:
                1. Tone (Casual, Formal, Terse, Friendly?)
                2. Sentence structure (Short/Long?)
                3. Common greetings/sign-offs.
                4. Vocabulary level.
                
                Emails:
                ${samples}
            `
        });

        const learner = object as { styleProfile: string; signature: string };

        console.log("✅ Voice Learned:", learner.styleProfile);
        return `${learner.styleProfile} Sign off with: "${learner.signature}".`;

    } catch (e) {
        console.error("Voice learning failed", e);
        return "Professional, concise, standard business tone.";
    }
}

