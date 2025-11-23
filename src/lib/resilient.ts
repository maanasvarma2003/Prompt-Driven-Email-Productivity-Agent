import { generateObject, streamText } from 'ai';
import { groq } from './groq';
import { FAST_MODEL, SMART_MODEL, FAST_PARAMS, DEEP_PARAMS } from './ai';

// Custom Error Class for Quota Issues
class AIQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIQuotaError";
  }
}

/**
 * Resilient wrapper for generateObject.
 * Supports Hybrid Model selection ('fast' | 'smart').
 * Includes automatic retry for transient failures.
 */
export async function resilientGenerateObject<T>(params: any & { mode?: 'fast' | 'smart' }) {
  const modelId = params.mode === 'fast' ? FAST_MODEL : SMART_MODEL;
  const tuningParams = params.mode === 'fast' ? FAST_PARAMS : DEEP_PARAMS;

  console.log(`🧠 [Groq] Generating with ${modelId} (${params.mode || 'smart'} mode)...`);
  
  // We strip 'mode' from params before passing to generateObject
  const { mode, ...aiSDKParams } = params;

  try {
      return await generateObject({
        ...aiSDKParams,
        model: groq(modelId),
        temperature: tuningParams.temperature,
      });
  } catch (error: any) {
      console.warn(`⚠️ Primary model ${modelId} failed. Retrying with backup...`);
      // Fallback strategy: If Smart fails, try Fast (for speed/availability) or vice versa?
      // Usually if 70B fails, 8B might work if it's a load issue.
      // Or retry same model once.
      
      if (params.mode === 'smart') {
          console.log(`🔄 Fallback: Trying FAST_MODEL for resilience.`);
          return await generateObject({
            ...aiSDKParams,
            model: groq(FAST_MODEL), // Fallback to lighter model
            temperature: FAST_PARAMS.temperature,
          });
      }
      throw error;
  }
}

/**
 * Resilient wrapper for streamText.
 * Supports Hybrid Model selection ('fast' | 'smart').
 */
export async function resilientStreamText(params: any & { mode?: 'fast' | 'smart' }) {
   const modelId = params.mode === 'fast' ? FAST_MODEL : SMART_MODEL;
   const tuningParams = params.mode === 'fast' ? FAST_PARAMS : DEEP_PARAMS;

   console.log(`🧠 [Groq] Streaming with ${modelId} (${params.mode || 'smart'} mode)...`);

   const { mode, ...aiSDKParams } = params;

   return await streamText({
      ...aiSDKParams,
      model: groq(modelId),
      temperature: tuningParams.temperature,
   });
}
