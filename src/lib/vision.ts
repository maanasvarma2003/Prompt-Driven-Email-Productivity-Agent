import { groq, VISION_MODEL, VISION_PARAMS } from './groq';
import { generateText } from 'ai';

export async function analyzeImage(imageBase64: string, prompt: string = "Describe this image for an email context.") {
  try {
    const { text } = await generateText({
      model: groq(VISION_MODEL),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageBase64 },
          ],
        },
      ],
      ...VISION_PARAMS,
    });
    return text;
  } catch (error) {
    console.error("Vision API Error:", error);
    return "Failed to analyze image.";
  }
}

