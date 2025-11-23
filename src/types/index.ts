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

export interface Draft {
  id: string;
  emailId: string;
  subject: string;
  body: string;
  followUpSuggestions?: string[];
  createdAt: string;
}

export interface SentEmail {
  id: string;
  emailId: string;
  recipient: string;
  subject: string;
  body: string;
  sentAt: string;
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
