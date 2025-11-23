import { resilientGenerateObject } from './resilient';
import { z } from 'zod';

// --- ADVANCED SEMANTIC MEMORY ---
// Simulates a high-performance vector store using local embeddings or semantic extraction.

interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[]; // Placeholder for future real embeddings
  keywords: string[];
}

// In-memory store (simulating Pinecone/pgvector)
const vectorStore: VectorDocument[] = [];

// Use LLM to extract semantic keywords as "concept embeddings"
// This is "Agentic RAG" - using the LLM to index content intelligently.
export async function embedDocument(id: string, content: string) {
  // 1. Check if already indexed
  if (vectorStore.find(d => d.id === id)) return;

  try {
      // 2. Extract Concepts
      const { object } = await resilientGenerateObject({
        mode: 'fast',
        schema: z.object({
            keywords: z.array(z.string()).describe("5-10 abstract concepts, emotions, or topics from this text. Not just words present, but underlying meaning.")
        }),
        prompt: `Extract the core semantic concepts from this text for a vector search engine:\n"${content.substring(0, 1000)}"`
      });

      const data = object as { keywords: string[] };

      vectorStore.push({
          id,
          content,
          keywords: data.keywords.map((k: string) => k.toLowerCase())
      });
      
      // console.log(`🧠 Indexed ${id} with concepts: [${data.keywords.join(', ')}]`);

  } catch (e) {
      console.error("Indexing failed:", e);
      // Fallback: simple tokenization
      vectorStore.push({
          id,
          content,
          keywords: content.toLowerCase().split(' ').filter(w => w.length > 4)
      });
  }
}

export async function searchVectors(query: string, limit = 5) {
    // 1. Expand Query
    let queryConcepts: string[] = [];
    try {
        const { object } = await resilientGenerateObject({
            mode: 'fast',
            schema: z.object({
                concepts: z.array(z.string())
            }),
            prompt: `Convert this user query into 3-5 abstract semantic search terms:\nQuery: "${query}"`
        });
        const data = object as { concepts: string[] };
        queryConcepts = data.concepts.map((c: string) => c.toLowerCase());
    } catch (e) {
        queryConcepts = query.toLowerCase().split(' ');
    }

    // console.log(`🔍 Semantic Search for: "${query}" -> [${queryConcepts.join(', ')}]`);

    // 2. Score Documents (Jaccard Similarity / Concept Overlap)
    // Since we don't have a real embedding model loaded in browser/serverless efficiently,
    // we use "Concept Overlap" which is surprisingly effective for this scale.
    const scores = vectorStore.map(doc => {
        const intersection = doc.keywords.filter(k => queryConcepts.some(q => k.includes(q) || q.includes(k)));
        // Score = (Matches * 2) / (Total Doc Keywords + Total Query Keywords)
        const score = (intersection.length * 2) / (doc.keywords.length + queryConcepts.length);
        return { id: doc.id, score, content: doc.content };
    });

    return scores
        .filter(s => s.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

