import { db } from './store';
import { resilientGenerateObject } from './resilient';
import { z } from 'zod';
// import cosineSimilarity from 'cosine-similarity';

// Define schema for style learning
const StyleProfileSchema = z.object({
  tone: z.string(),
  keywords: z.array(z.string()),
  structure: z.string(),
  signature: z.string(),
});

// Simple in-memory embedding mock (since we can't use OpenAI embeddings easily without another key)
// We'll use a keyword-based "fingerprint" for now to find similar past emails.
// function generateFingerprint(text: string): number[] {
//   // Mock vector: just counts of common words to create a "style vector"
//   const commonWords = ['hi', 'hello', 'dear', 'best', 'regards', 'cheers', 'thanks', 'sincerely'];
//   const vector = commonWords.map(w => (text.toLowerCase().match(new RegExp(`\\b${w}\\b`, 'g')) || []).length);
//   return vector;
// }

export async function learnFromEdit(originalDraft: string, finalDraft: string) {
  // 1. Detect significant changes
  if (originalDraft === finalDraft) return;

  // 2. Extract style markers using LLM
  try {
    const { object } = await resilientGenerateObject({
      mode: 'fast',
      schema: StyleProfileSchema,
      prompt: `Analyze the writing style of this text: "${finalDraft}". 
      Extract tone, specific keywords used for greetings/closings, sentence structure preference, and signature.`,
    });

    const styleData = object as z.infer<typeof StyleProfileSchema>;
    
    // 3. Save to Store (Digital DNA)
    // We update the global user style string in store for simplicity, 
    // or we could append to a list of "Style Samples".
    const styleString = `Tone: ${styleData.tone}. Signature: ${styleData.signature}. Keywords: ${styleData.keywords.join(', ')}.`;
    db.updateUserStyle(styleString);
    console.log("🧬 Digital DNA Updated:", styleString);

  } catch (e) {
    console.error("Style Learning Failed:", e);
  }
}

export function getStyleContext(): string {
  return db.getUserStyle();
}
