import { generateObject, streamText } from 'ai';
import { groq } from './groq';
import { FAST_MODEL, SMART_MODEL, FAST_PARAMS, DEEP_PARAMS } from './groq';

// Re-export models so other files can import them from here if needed
export { FAST_MODEL, SMART_MODEL };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resilientGenerateObject<T>(params: any & { mode?: 'fast' | 'smart' }) {
  const modelId = params.mode === 'fast' ? FAST_MODEL : SMART_MODEL;
  const tuningParams = params.mode === 'fast' ? FAST_PARAMS : DEEP_PARAMS;

  console.log(`🧠 [Groq] Generating with ${modelId} (${params.mode || 'smart'} mode)...`);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mode, ...aiSDKParams } = params;

  try {
    return await generateObject({
      ...aiSDKParams,
      model: groq(modelId),
      temperature: tuningParams.temperature,
      maxTokens: tuningParams.maxTokens,
    });
  } catch (error: unknown) {
    console.warn(`⚠️ Primary model ${modelId} failed. Retrying with backup...`);
    if (params.mode === 'smart') {
      console.log(`🔄 Fallback: Trying FAST_MODEL for resilience.`);
      return await generateObject({
        ...aiSDKParams,
        model: groq(FAST_MODEL),
        temperature: FAST_PARAMS.temperature,
        maxTokens: FAST_PARAMS.maxTokens,
      });
    }
    throw error;
  }
}

// Enhanced streaming with better error handling and parameter support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resilientStreamText(params: any & { mode?: 'fast' | 'smart' }) {
  const modelId = params.mode === 'fast' ? FAST_MODEL : SMART_MODEL;
  const tuningParams = params.mode === 'fast' ? FAST_PARAMS : DEEP_PARAMS;
  
  // Use provided params or fall back to defaults
  const finalParams = {
    ...params,
    model: groq(modelId),
    temperature: params.temperature ?? tuningParams.temperature,
    maxTokens: params.maxTokens ?? tuningParams.maxTokens,
  };
  
  // Remove mode from params
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mode, ...streamParams } = finalParams;
  
  try {
    return await streamText(streamParams);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorLower = errorMessage.toLowerCase();
    
    // Don't retry on API key errors - fail fast with clear message
    if (errorLower.includes('api key') || errorLower.includes('invalid') || errorLower.includes('unauthorized') || errorLower.includes('401')) {
      throw new Error(`Invalid API Key: ${errorMessage}. Please check your GROQ_API_KEY in .env.local file. Get your key at https://console.groq.com`);
    }
    
    console.warn(`⚠️ Stream failed with ${modelId}. Fallback to FAST_MODEL.`, error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mode: _, ...fallbackParams } = {
      ...params,
      model: groq(FAST_MODEL),
      temperature: params.temperature ?? FAST_PARAMS.temperature,
      maxTokens: params.maxTokens ?? FAST_PARAMS.maxTokens,
    };
    
    try {
      return await streamText(fallbackParams);
    } catch (fallbackError: unknown) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      const fallbackLower = fallbackMessage.toLowerCase();
      
      if (fallbackLower.includes('api key') || fallbackLower.includes('invalid') || fallbackLower.includes('unauthorized')) {
        throw new Error(`Invalid API Key: ${fallbackMessage}. Please check your GROQ_API_KEY in .env.local file. Get your key at https://console.groq.com`);
      }
      
      throw fallbackError;
    }
  }
}
