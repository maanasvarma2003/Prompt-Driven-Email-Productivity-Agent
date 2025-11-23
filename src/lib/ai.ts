import { createOpenAI } from '@ai-sdk/openai';

// Create a custom OpenAI provider instance for Groq
export const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || "",
});

// Model Definitions for Specific Roles
export const FAST_MODEL = 'llama-3.1-8b-instant'; 
export const SMART_MODEL = 'llama-3.3-70b-versatile';
export const VISION_MODEL = 'llama-3.2-90b-vision-preview';

// Parameter Presets
export const FAST_PARAMS = { temperature: 0.1, maxTokens: 1024 };
export const DEEP_PARAMS = { temperature: 0.3, maxTokens: 4096 };
export const VISION_PARAMS = { temperature: 0.2, maxTokens: 2048 };
