import { createOpenAI } from '@ai-sdk/openai';

// Create a custom OpenAI provider instance for Groq
export const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  // prioritized: env var > hardcoded key (user provided)
  apiKey: process.env.GROQ_API_KEY || "", 
});

// Default fast model
export const GROQ_MODEL = 'llama-3.1-8b-instant'; 
export const GROQ_LARGE_MODEL = 'llama-3.3-70b-versatile';
