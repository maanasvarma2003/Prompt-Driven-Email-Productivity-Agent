import { Email } from '@/types';
import natural from 'natural';

// Initialize Tokenizer and TfIdf
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();

// Cache for TF-IDF to avoid re-computing on every request (Simulating Vector Store)
let isIndexed = false;
let emailIndexMap: string[] = [];

export function indexEmails(emails: Email[]) {
  if (isIndexed && emailIndexMap.length === emails.length) return; // Simple cache check

  // Reset
  const newTfidf = new natural.TfIdf();
  emailIndexMap = [];

  emails.forEach(email => {
    const content = `${email.subject} ${email.body} ${email.sender}`;
    newTfidf.addDocument(content);
    emailIndexMap.push(email.id);
  });

  // Swap global instance (hacky but works for serverless demo)
  (tfidf as any).documents = (newTfidf as any).documents;
  isIndexed = true;
}

export function semanticSearch(query: string, emails: Email[], limit = 5): Email[] {
  indexEmails(emails);

  const scores: { id: string; score: number }[] = [];

  tfidf.tfidfs(query, (i, measure) => {
    scores.push({ id: emailIndexMap[i], score: measure });
  });

  // Filter by score threshold and sort
  const topResults = scores
    .filter(s => s.score > 0.5) // Relevance threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return topResults
    .map(r => emails.find(e => e.id === r.id))
    .filter((e): e is Email => !!e);
}






