import { NextResponse } from 'next/server';
import { groq } from '@/lib/groq';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use Groq to transform the user's simple text into a high-fidelity visual description
    // tailored for a generative model (like Pollinations/Stable Diffusion)
    const { text: visualDescription } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are an expert AI Visual Prompt Engineer. 
      Your goal is to convert a user's script/intent into a highly detailed visual description for an AI Avatar generator.
      
      Guidelines:
      - Focus on the SUBJECT (person/avatar), BACKGROUND, and LIGHTING.
      - Make it look "Hyper-Real", "Cinematic", "4K".
      - Do NOT include text about the script itself, just the visual appearance.
      - Keep it under 30 words for faster generation.
      
      Example Input: "Tell my boss I'll be late"
      Example Output: "Professional man in business suit looking apologetic, modern glass office background, soft cinematic lighting, 8k resolution, photorealistic"
      `,
      prompt: `Input: "${prompt}"`,
    });

    return NextResponse.json({ visualDescription: visualDescription.trim() });
  } catch (error: any) {
    console.error('Video Prompt Generation Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

