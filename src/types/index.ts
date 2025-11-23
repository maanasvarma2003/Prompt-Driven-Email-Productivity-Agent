export interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  category?: 'Important' | 'Newsletter' | 'Spam' | 'To-Do' | 'Uncategorized';
  actionItems?: ActionItem[];
  analysis?: string; // Summary
  sentiment?: 'Positive' | 'Neutral' | 'Negative' | 'Urgent';
  senderProfile?: {
    archetype: string;
    strategy: string;
  };
  entities?: string[];
}

export interface ActionItem {
  task: string;
  deadline?: string | null;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface PromptConfig {
  id: string;
  name: string; 
  template: string;
  type: 'categorization' | 'extraction' | 'reply' | 'chat';
}

export interface Attachment {
  name: string;
  size: number;
  type: string;
}

export interface Draft {
  id: string;
  emailId: string;
  subject: string;
  body: string;
  followUpSuggestions?: string[];
  createdAt: string;
  attachments?: Attachment[];
  swarmAnalysis?: string; // New field for Swarm output
}

export interface SentEmail {
  id: string;
  emailId: string;
  recipient: string;
  subject: string;
  body: string;
  sentAt: string;
  attachments?: Attachment[];
}

export interface Entity {
  id: string;
  name: string;
  type: 'Person' | 'Organization' | 'Topic' | 'Date';
  mentions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Task {
  id: string;
  emailId: string;
  task: string;
  deadline?: string | null;
  priority: 'High' | 'Medium' | 'Low';
  status: 'todo' | 'in-progress' | 'done';
  source: string;
}
