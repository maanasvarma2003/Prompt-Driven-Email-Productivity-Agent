import { Email } from '@/types';
import natural from 'natural';

// Advanced RAG System with Multi-Modal Search
const tfidf = new natural.TfIdf();
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Cache for TF-IDF to avoid re-computing on every request
let isIndexed = false;
let emailIndexMap: string[] = [];

// Enhanced indexing with metadata
export function indexEmails(emails: Email[]) {
  if (isIndexed && emailIndexMap.length === emails.length) return;

  const newTfidf = new natural.TfIdf();
  emailIndexMap = [];

  emails.forEach(email => {
    // Enhanced content extraction with metadata
    const metadata = [
      email.category || '',
      email.analysis || '',
      ...(email.actionItems?.map(item => item.task) || []),
      ...(email.entities || []),
    ].join(' ');

    const content = `${email.subject} ${email.body} ${email.sender} ${metadata}`;
    newTfidf.addDocument(content);
    emailIndexMap.push(email.id);
  });

  // Swap global instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tfidf as any).documents = (newTfidf as any).documents;
  isIndexed = true;
}

// Advanced semantic search with multiple strategies
export function semanticSearch(query: string, emails: Email[], limit = 10): Email[] {
  indexEmails(emails);

  // Strategy 1: TF-IDF scoring
  const tfidfScores: { id: string; score: number }[] = [];
  tfidf.tfidfs(query, (i, measure) => {
    tfidfScores.push({ id: emailIndexMap[i], score: measure });
  });

  // Strategy 2: Keyword matching with stemming
  const queryTerms = tokenizer.tokenize(query.toLowerCase()) || [];
  const stemmedQuery = queryTerms.map(term => stemmer.stem(term));

  // Strategy 3: Fuzzy matching for sender/subject
  const keywordScores: { id: string; score: number }[] = emails.map(email => {
    let score = 0;
    const emailText = `${email.subject} ${email.body} ${email.sender}`.toLowerCase();
    const emailTerms = tokenizer.tokenize(emailText) || [];
    const stemmedEmail = emailTerms.map(term => stemmer.stem(term));

    // Exact matches
    queryTerms.forEach(term => {
      if (emailText.includes(term)) score += 2;
      if (email.sender.toLowerCase().includes(term)) score += 3;
      if (email.subject.toLowerCase().includes(term)) score += 3;
    });

    // Stemmed matches
    stemmedQuery.forEach(stem => {
      if (stemmedEmail.includes(stem)) score += 1;
    });

    // Category/analysis matches
    if (email.category && query.toLowerCase().includes(email.category.toLowerCase())) {
      score += 2;
    }
    if (email.analysis && email.analysis.toLowerCase().includes(query.toLowerCase())) {
      score += 2;
    }

    return { id: email.id, score };
  });

  // Combine scores with weighted average
  const combinedScores = emails.map(email => {
    const tfidfScore = tfidfScores.find(s => s.id === email.id)?.score || 0;
    const keywordScore = keywordScores.find(s => s.id === email.id)?.score || 0;
    
    // Weighted combination: TF-IDF (70%) + Keyword (30%)
    const finalScore = (tfidfScore * 0.7) + (keywordScore * 0.3);
    
    return { id: email.id, score: finalScore };
  });

  // Filter and sort by relevance
  const topResults = combinedScores
    .filter(s => s.score > 0.1) // Lower threshold for better recall
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return topResults
    .map(r => emails.find(e => e.id === r.id))
    .filter((e): e is Email => !!e);
}

// Advanced context retrieval for RAG
export function retrieveRelevantContext(query: string, emails: Email[], maxEmails = 15): Email[] {
  // Use semantic search for relevant emails
  const relevant = semanticSearch(query, emails, maxEmails);
  
  // If we have processed emails with analysis, prioritize them
  const withAnalysis = relevant.filter(e => e.analysis);
  const withoutAnalysis = relevant.filter(e => !e.analysis);
  
  // Return processed emails first, then unprocessed
  return [...withAnalysis, ...withoutAnalysis].slice(0, maxEmails);
}






