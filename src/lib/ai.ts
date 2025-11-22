import { groq } from './groq';

// --- HYBRID MODEL ARCHITECTURE ---
// We use Groq's LPU to achieve millisecond inference speeds.

// 1. THE SPEEDSTER (Llama-3.1 8B Instant)
// Extremely fast (hundreds of tokens/sec), perfect for real-time UI updates, chips, and simple chat.
export const FAST_MODEL = 'llama-3.1-8b-instant'; 

// 2. THE BRAIN (Llama-3.3 70B Versatile)
// The state-of-the-art open model. Massive intelligence, perfect for complex reasoning, drafting, and deep analysis.
export const SMART_MODEL = 'llama-3.3-70b-versatile';

// 3. THE VISIONARY (Llama-3.2 90B Vision)
// Multi-modal capability for analyzing attachments, receipts, and screenshots.
export const VISION_MODEL = 'llama-3.2-90b-vision-preview';

// Fallback default
export const LOCAL_MODEL = SMART_MODEL;

// "Turbo Mode" Parameters for 0ms latency perception
export const FAST_PARAMS = {
  temperature: 0.1, // Deterministic for speed
  topP: 0.9,
  maxTokens: 1024,
};

// "Deep Thought" Parameters for Complex Analysis (Drafting/Reasoning)
export const DEEP_PARAMS = {
  temperature: 0.3, // Slight creativity for human-like text
  topP: 0.95,
  maxTokens: 4096, // Allow longer responses
};

// "Vision" Parameters
export const VISION_PARAMS = {
  temperature: 0.1,
  maxTokens: 2048,
};
