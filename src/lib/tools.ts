import { resilientGenerateObject } from './resilient';
import { z } from 'zod';

// --- AUTONOMOUS TOOLS REGISTRY ---
// Simulates agentic tool execution.

export type ToolName = 'calendar_add' | 'jira_ticket' | 'unsubscribe' | 'web_search';

interface ToolOutput {
    success: boolean;
    message: string;
    data?: any;
}

export const TOOLS: Record<ToolName, { description: string, execute: (params: any) => Promise<ToolOutput> }> = {
    calendar_add: {
        description: "Add an event to Google Calendar. Params: title, time, date.",
        execute: async (params: any): Promise<ToolOutput> => {
            console.log("📅 Tool Executed: Calendar Add", params);
            return { success: true, message: `Scheduled "${params.title}" for ${params.date} at ${params.time}. (Mock Integration)` };
        }
    },
    jira_ticket: {
        description: "Create a Jira ticket. Params: title, description, priority.",
        execute: async (params: any): Promise<ToolOutput> => {
            console.log("🐛 Tool Executed: Jira Ticket", params);
            return { success: true, message: `Created Jira Ticket PROJ-${Math.floor(Math.random()*1000)}: ${params.title}. (Mock Integration)` };
        }
    },
    unsubscribe: {
        description: "Unsubscribe from a mailing list. Params: sender_email.",
        execute: async (params: any): Promise<ToolOutput> => {
            console.log("🚫 Tool Executed: Unsubscribe", params);
            return { success: true, message: `Successfully unsubscribed from ${params.sender_email}.` };
        }
    },
    web_search: {
        description: "Search the web for information. Params: query.",
        execute: async (params: any): Promise<ToolOutput> => {
            console.log("🌐 Tool Executed: Web Search", params);
            return { success: true, message: `Found info on "${params.query}": Top result indicates positive sentiment.` };
        }
    }
};

const ToolCallSchema = z.object({
    toolName: z.enum(['calendar_add', 'jira_ticket', 'unsubscribe', 'none']),
    parameters: z.record(z.string(), z.any()).optional()
});

export async function determineToolUsage(userQuery: string) {
    try {
        const { object } = await resilientGenerateObject({
            mode: 'fast',
            schema: ToolCallSchema,
            prompt: `
                Does the user want to perform an action?
                Query: "${userQuery}"
                
                Available Tools:
                - calendar_add: Schedule meetings.
                - jira_ticket: Report bugs/tasks.
                - unsubscribe: Stop emails.
                
                Return 'none' if it's just a question.
            `
        });

        const toolCall = object as z.infer<typeof ToolCallSchema>;

        if (toolCall.toolName !== 'none' && TOOLS[toolCall.toolName]) {
            // Execute Tool
            const result = await TOOLS[toolCall.toolName].execute(toolCall.parameters);
            return result;
        }
        return null;

    } catch (e) {
        return null;
    }
}

