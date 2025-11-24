import { createOpenAI } from '@ai-sdk/openai';

// Get API key from environment with better validation
function getGroqApiKey(): string {
  // Check environment variable first
  const envKey = process.env.GROQ_API_KEY;
  
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }
  
  // If no env key, return empty string (will be caught by validation)
  console.warn('⚠️ GROQ_API_KEY not found in environment variables');
  return "";
}

// Validate API key format
function validateApiKey(key: string): boolean {
  if (!key || key.trim().length === 0) {
    return false;
  }
  // Groq API keys typically start with 'gsk_' and are 51+ characters
  return key.startsWith('gsk_') && key.length >= 51;
}

const apiKey = getGroqApiKey();

// Create a custom OpenAI provider instance for Groq
export const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: apiKey,
});

// Export validation function for use in API routes
export function validateGroqApiKey(): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      valid: false,
      error: 'GROQ_API_KEY is not set. Please add it to your .env.local file. Get your key at https://console.groq.com'
    };
  }
  
  if (!validateApiKey(apiKey)) {
    return {
      valid: false,
      error: 'GROQ_API_KEY appears to be invalid. Please check your .env.local file. Keys should start with "gsk_" and be at least 51 characters long.'
    };
  }
  
  return { valid: true };
}

// Model Definitions for Specific Roles
export const FAST_MODEL = 'llama-3.1-8b-instant'; 
export const SMART_MODEL = 'llama-3.3-70b-versatile';
export const VISION_MODEL = 'llama-3.2-90b-vision-preview';

// Parameter Presets
export const FAST_PARAMS = { temperature: 0.1, maxTokens: 1024 };
export const DEEP_PARAMS = { temperature: 0.3, maxTokens: 4096 };
export const VISION_PARAMS = { temperature: 0.2, maxTokens: 2048 };
