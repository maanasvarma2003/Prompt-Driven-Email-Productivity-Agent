import { generateObject, streamText } from 'ai';
import { groq } from './groq';
import { FAST_MODEL, SMART_MODEL, FAST_PARAMS, DEEP_PARAMS } from './ai';

// Re-export models so other files can import them from here if needed
export { FAST_MODEL, SMART_MODEL };

export async function resilientGenerateObject<T>(params: any & { mode?: 'fast' | 'smart' }) {
  const modelId = params.mode === 'fast' ? FAST_MODEL : SMART_MODEL;
  const tuningParams = params.mode === 'fast' ? FAST_PARAMS : DEEP_PARAMS;

  console.log(`🧠 [Groq] Generating with ${modelId} (${params.mode || 'smart'} mode)...`);
  
  const { mode, ...aiSDKParams } = params;

  try {
      return await generateObject({
        ...aiSDKParams,
        model: groq(modelId),
        temperature: tuningParams.temperature,
      });
  } catch (error: any) {
      console.warn(`⚠️ Primary model ${modelId} failed. Retrying with backup...`);
      if (params.mode === 'smart') {
          console.log(`🔄 Fallback: Trying FAST_MODEL for resilience.`);
          return await generateObject({
            ...aiSDKParams,
            model: groq(FAST_MODEL),
            temperature: FAST_PARAMS.temperature,
          });
      }
      throw error;
  }
}

export async function resilientStreamText(params: any & { mode?: 'fast' | 'smart' }) {
    const modelId = params.mode === 'fast' ? FAST_MODEL : SMART_MODEL;
    
    try {
        return await streamText({
            ...params,
            model: groq(modelId),
        });
    } catch (error) {
        console.warn(`⚠️ Stream failed with ${modelId}. Fallback to FAST_MODEL.`);
        return await streamText({
            ...params,
            model: groq(FAST_MODEL),
        });
    }
}
