import { SentEmail } from "@/types";

// --- PRE-COG ENGINE ---
// Predicts future emails based on temporal habits.

export function predictNextEmail(sentEmails: SentEmail[]) {
    if (sentEmails.length < 5) return null;

    // 1. Analyze Frequency
    const recipients: Record<string, number[]> = {}; // "email": [dayOfWeek, dayOfWeek...]
    
    sentEmails.forEach(email => {
        const date = new Date(email.sentAt);
        const day = date.getDay(); // 0-6
        if (!recipients[email.recipient]) recipients[email.recipient] = [];
        recipients[email.recipient].push(day);
    });

    const today = new Date().getDay();
    let prediction = null;

    // 2. Check for Patterns
    for (const [recipient, days] of Object.entries(recipients)) {
        const countForToday = days.filter(d => d === today).length;
        const total = days.length;
        const probability = countForToday / total; // Rough prob

        // If > 30% chance we email this person on this day
        if (probability > 0.3 && total >= 2) {
            prediction = {
                recipient,
                reason: `You usually email ${recipient.split('@')[0]} on ${['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'][today]}.`,
                confidence: Math.round(probability * 100)
            };
            break; // Just one for now
        }
    }

    return prediction;
}





