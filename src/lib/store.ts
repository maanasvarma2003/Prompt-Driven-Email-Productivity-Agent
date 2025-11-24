  import { Email, PromptConfig, Draft, SentEmail, Entity, Task, Attachment } from "@/types";
import { mockInbox } from "@/data/mock-inbox";
import { defaultPrompts } from "@/data/default-prompts";

// In a real app, this would be a database connection (Postgres/SQLite)
// For this assignment, we use an in-memory store initialized with mock data.
// Note: On Vercel serverless, this state will reset when the lambda cold starts.
// For persistent storage, we would use Vercel KV or Postgres.

class Store {
  private emails: Email[];
  private prompts: PromptConfig[];
  private drafts: Draft[];
  private sentEmails: SentEmail[];
  private entities: Entity[];
  private tasks: Task[]; // Separate task store for persistence
  private userStyle: string; // Simulated User Style Profile

  constructor() {
    this.emails = [...mockInbox];
    this.prompts = [...defaultPrompts];
    this.drafts = [];
    this.sentEmails = [];
    this.entities = [];
    this.tasks = [];
    this.userStyle = "Professional, concise, uses 'Best regards'";
  }

  getUserStyle(): string {
    return this.userStyle;
  }

  updateUserStyle(newStyle: string) {
    this.userStyle = newStyle;
  }

  // ... existing methods ...

  getEntities(): Entity[] {
    return this.entities;
  }

  addEntity(name: string, type: 'Person' | 'Organization' | 'Topic', emailId: string) {
    const existing = this.entities.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!existing.mentions.includes(emailId)) {
        existing.mentions.push(emailId);
      }
    } else {
      this.entities.push({
        id: Math.random().toString(36).substring(7),
        name,
        type,
        mentions: [emailId]
      });
    }
  }

  getEmails(): Email[] {
    return this.emails;
  }

  getEmail(id: string): Email | undefined {
    return this.emails.find((e) => e.id === id);
  }

  updateEmail(id: string, updates: Partial<Email>): Email | undefined {
    const index = this.emails.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    
    this.emails[index] = { ...this.emails[index], ...updates };
    
    // If email updates include action items, sync them to the task store
    if (updates.actionItems) {
       updates.actionItems.forEach(item => {
         // Check if task already exists to avoid duplicates
         const exists = this.tasks.some(t => t.task === item.task && t.emailId === id);
         if (!exists) {
           this.tasks.push({
             id: Math.random().toString(36).substring(7),
             emailId: id,
             task: item.task,
             deadline: item.deadline,
             priority: item.priority || 'Medium',
             status: 'todo',
             source: this.emails[index].subject
           });
         }
       });
    }
    
    return this.emails[index];
  }

  getPrompts(): PromptConfig[] {
    return this.prompts;
  }

  updatePrompt(id: string, template: string): PromptConfig | undefined {
    const index = this.prompts.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    this.prompts[index] = { ...this.prompts[index], template };
    return this.prompts[index];
  }

  createDraft(draft: Draft): Draft {
    this.drafts.push(draft);
    return draft;
  }

  getDrafts(): Draft[] {
    return this.drafts;
  }
  
  getDraftsForEmail(emailId: string): Draft[] {
    return this.drafts.filter(d => d.emailId === emailId);
  }

  updateDraft(id: string, updates: Partial<Draft>): Draft | undefined {
    const index = this.drafts.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    this.drafts[index] = { ...this.drafts[index], ...updates };
    return this.drafts[index];
  }

  deleteDraft(id: string): boolean {
    const index = this.drafts.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.drafts.splice(index, 1);
    return true;
  }

  getSentEmails(): SentEmail[] {
    return this.sentEmails;
  }

  sendDraft(draftId: string, attachments?: Attachment[]): SentEmail | null {
    const draftIndex = this.drafts.findIndex(d => d.id === draftId);
    if (draftIndex === -1) {
      console.error(`Draft ${draftId} not found in store`);
      return null;
    }

    const draft = this.drafts[draftIndex];
    const originalEmail = this.emails.find(e => e.id === draft.emailId);
    
    if (!originalEmail) {
      console.error(`Original email ${draft.emailId} not found for draft ${draftId}`);
      // Still create sent email even if original email is missing
    }
    
    const sentEmail: SentEmail = {
      id: Math.random().toString(36).substring(7),
      emailId: draft.emailId || '',
      recipient: originalEmail ? originalEmail.sender : draft.emailId ? "Unknown" : "Unknown",
      subject: draft.subject || 'No Subject',
      body: draft.body || '',
      sentAt: new Date().toISOString(),
      attachments: attachments || draft.attachments || []
    };

    this.sentEmails.push(sentEmail);
    this.drafts.splice(draftIndex, 1); // Remove from drafts
    
    console.log(`Email sent successfully: ${sentEmail.id} to ${sentEmail.recipient}`);
    return sentEmail;
  }

  // Tasks Management
  getTasks(): Task[] {
    return this.tasks;
  }

  updateTaskStatus(taskId: string, status: 'todo' | 'in-progress' | 'done') {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex].status = status;
    }
  }

  reset() {
    // Deep clone to ensure we start fresh and don't mutate the original mock data across resets
    // if structuredClone is available (Node 17+), else JSON parse/stringify
    this.emails = JSON.parse(JSON.stringify(mockInbox));
    
    // Force "Unprocessed" and "Unread" state as requested
    this.emails = this.emails.map(email => ({
      ...email,
      isRead: false, // Reset read status
      category: undefined, // Remove category
      actionItems: undefined, // Remove extracted tasks
      analysis: undefined // Remove summaries
    }));

    this.prompts = [...defaultPrompts];
    this.drafts = [];
    this.sentEmails = [];
    this.entities = [];
    this.tasks = []; // Reset tasks
  }
}

// Singleton instance
export const db = new Store();
