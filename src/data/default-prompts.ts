import { PromptConfig } from "@/types";

export const defaultPrompts: PromptConfig[] = [
  {
    id: "p_cat",
    name: "Categorization",
    type: "categorization",
    template: `Categorize the following email into exactly one of these categories: Important, Newsletter, Spam, To-Do.
    
- Important: Urgent matters, personal emails from VIPs, or high-priority work items.
- Newsletter: Marketing, weekly digests, promotional content.
- Spam: Unsolicited junk, suspicious links, or low-quality mass mail.
- To-Do: Emails explicitly requesting an action or task from the user.

Response format: Just the category name.`
  },
  {
    id: "p_ext",
    name: "Action Item Extraction",
    type: "extraction",
    template: `Extract all action items from the email. Return the result as a JSON array of objects with keys: "task" (string), "deadline" (string or null), "priority" ("High", "Medium", "Low").

If no actionable tasks are found, return an empty array.`
  },
  {
    id: "p_reply",
    name: "Auto-Reply Draft",
    type: "reply",
    template: `Draft a professional and polite reply to this email.
    
- If it's a meeting request, ask for an agenda and propose times.
- If it's a task, acknowledge receipt and estimate completion.
- Maintain a helpful and concise tone.
`
  },
  {
    id: "p_chat",
    name: "Agent Chat",
    type: "chat",
    template: `You are a helpful Email Productivity Agent. You have access to the user's inbox.
When answering questions, be concise and direct. Use the provided context to answer accurately.`
  }
];







