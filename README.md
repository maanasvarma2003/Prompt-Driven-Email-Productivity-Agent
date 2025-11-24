# MailMint AI (Groq Edition)

**MailMint AI** is an advanced, high-efficiency email productivity agent powered by **Groq LPU** for millisecond-speed processing and generation.

## 🚀 Features

-   **Ultra-Fast AI**: Uses **Groq LPU** (`llama3-8b` / `llama3-70b`) for instant results.
-   **Smart Drafts**: One-click drafting that saves to your Drafts folder.
-   **Semantic Inbox**: Search your emails instantly.
-   **Dashboard**: Visual analytics of your inbox status.
-   **Agent Chat**: Full RAG-based chat assistant.
-   **Voice Commands**: Use voice to draft replies quickly.
-   **Pre-Cog Engine**: Predictive email suggestions based on your sending patterns.

---

## 📋 Table of Contents

- [Setup Instructions](#-setup-instructions)
  - [Prerequisites](#prerequisites)
  - [How to Run the UI and Backend](#how-to-run-the-ui-and-backend)
  - [How to Load the Mock Inbox](#how-to-load-the-mock-inbox)
  - [How to Configure Prompts](#how-to-configure-prompts)
- [Usage Examples](#-usage-examples)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)

---

## 🛠 Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- A **Groq API Key** (free at [console.groq.com](https://console.groq.com))

### How to Run the UI and Backend

The application uses Next.js, which runs both the frontend (UI) and backend (API routes) in a single process.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/maanasvarma2003/Prompt-Driven-Email-Productivity-Agent.git
cd Prompt-Driven-Email-Productivity-Agent/email-agent
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Configure Environment Variables

**Option 1: Quick Setup Script (PowerShell)**
```powershell
.\setup-api-key.ps1 -ApiKey "your_groq_api_key_here"
```

**Option 2: Manual Setup**
Create a `.env.local` file in the `email-agent` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

**Option 3: Direct PowerShell Command**
```powershell
# Create or update .env.local file
@"
GROQ_API_KEY=your_groq_api_key_here
"@ | Out-File -FilePath .env.local -Encoding utf8
```

**Getting a Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `gsk_`) and use it in the setup script or `.env.local` file

**Important:** Never commit your `.env.local` file to the repository. It's already in `.gitignore`.

#### Step 4: Run the Development Server

```bash
npm run dev
```

The application will start on **http://localhost:3000**

Open your browser and navigate to `http://localhost:3000` to see the MailMint AI interface.

#### Step 5: Build for Production (Optional)

To create an optimized production build:

```bash
npm run build
npm start
```

**Note:** The backend API routes are automatically handled by Next.js. All API endpoints are available at `/api/*` routes.

---

### How to Load the Mock Inbox

The application comes with a pre-configured mock inbox that loads automatically when you start the application. The mock inbox is defined in `src/data/mock-inbox.ts` and includes sample emails for testing.

#### Automatic Loading

The mock inbox is **automatically loaded** when:
- The application starts for the first time
- You click the "Reset System" button in the sidebar

#### Manual Reset

To reload the mock inbox and reset all data:

1. Click the **"Reset System"** button in the bottom of the sidebar
2. This will:
   - Reload all mock emails
   - Clear all drafts
   - Clear all sent emails
   - Reset all emails to "unread" status
   - Remove all processing/analysis data

#### Customizing the Mock Inbox

To add your own test emails, edit `src/data/mock-inbox.ts`:

```typescript
export const mockInbox: Email[] = [
  {
    id: "e1",
    sender: "example@email.com",
    subject: "Your Email Subject",
    body: "Your email body content here...",
    timestamp: "2023-10-26T09:00:00Z",
    isRead: false,
  },
  // Add more emails...
];
```

After modifying the mock inbox, restart the development server to see your changes.

---

### How to Configure Prompts

Prompts control how the AI processes and responds to emails. You can customize prompts through the Settings modal.

#### Accessing Prompt Configuration

1. Click the **"Settings"** button in the bottom of the sidebar (gear icon)
2. The **"Agent Brain"** modal will open
3. You'll see different prompt categories in tabs

#### Available Prompt Types

1. **Categorization Prompt** (`p_cat`)
   - Determines how emails are categorized (Important, Newsletter, Spam, To-Do)
   - Customize the categorization logic and criteria

2. **Action Item Extraction** (`p_ext`)
   - Extracts tasks and action items from emails
   - Configures how deadlines and priorities are identified

3. **Auto-Reply Draft** (`p_reply`)
   - Controls the tone and style of auto-generated email drafts
   - Customize reply templates and formatting

4. **Agent Chat** (`p_chat`)
   - Configures the AI assistant's behavior in chat mode
   - Sets the personality and response style

#### Editing Prompts

1. Click on a prompt tab (e.g., "Categorization")
2. Edit the template text in the text area
3. Click **"Save"** to apply changes
4. Changes are saved immediately and will be used for future AI operations

#### Example: Customizing Categorization

```text
Categorize the following email into exactly one of these categories: Important, Newsletter, Spam, To-Do.

- Important: Urgent matters, personal emails from VIPs, or high-priority work items.
- Newsletter: Marketing, weekly digests, promotional content.
- Spam: Unsolicited junk, suspicious links, or low-quality mass mail.
- To-Do: Emails explicitly requesting an action or task from the user.

Response format: Just the category name.
```

#### Default Prompts Location

Default prompts are stored in `src/data/default-prompts.ts`. You can modify these directly in the code, or use the Settings modal for runtime changes.

---

## 💡 Usage Examples

### Example 1: Processing an Email

1. Navigate to **Inbox** from the sidebar
2. Click on any unprocessed email
3. Click the **"Process"** button (⚡ icon) in the email view
4. Wait a few seconds for AI analysis
5. View the results:
   - **Category**: Email classification
   - **Summary**: AI-generated summary
   - **Action Items**: Extracted tasks with priorities and deadlines
   - **Psych Profile**: Sender personality analysis (if available)

### Example 2: Drafting a Reply

**Method 1: Quick Draft**
1. Open an email in the Inbox view
2. Click the **"Draft"** button
3. The AI generates a reply based on the email content
4. Review and edit the draft if needed
5. Click **"Send Now"** to send, or save it for later

**Method 2: Voice Command**
1. Open an email
2. Click the **microphone icon** (🎤) in the header
3. Speak your instruction, e.g.:
   - "Draft a reply" (auto-mode)
   - "Reply saying I'll get back to you tomorrow"
4. The AI generates a draft based on your voice command

**Method 3: Smart Chips**
1. Open an email
2. Click on any **Smart Chip** button (e.g., "Acknowledge", "Schedule meeting")
3. A draft is generated with that context

### Example 3: Using the AI Agent Chat

1. Navigate to **AI Agent** from the sidebar
2. Type a question about your emails, e.g.:
   - "What emails need my attention?"
   - "Summarize the email from boss@company.com"
   - "What are my action items?"
3. The AI will analyze your inbox and provide answers

### Example 4: Viewing Sent Emails

1. Navigate to **Sent** from the sidebar
2. View all emails you've sent through the system
3. Each sent email shows:
   - Recipient
   - Subject
   - Sent timestamp
   - Attachments (if any)

### Example 5: Managing Drafts

1. Navigate to **Drafts** from the sidebar
2. View all saved drafts
3. Click on a draft to:
   - Edit the content
   - Send the email
   - Delete the draft

### Example 6: Dashboard Analytics

1. Navigate to **Dashboard** from the sidebar
2. View:
   - Email statistics (total, unread, processed)
   - Category breakdown
   - Recent activity
   - Pre-Cog predictions (if available)

---

## 📁 Project Structure

```
email-agent/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # Backend API routes
│   │   │   ├── process/       # Email processing endpoint
│   │   │   ├── draft/         # Draft generation endpoint
│   │   │   ├── send/          # Email sending endpoint
│   │   │   ├── emails/        # Email list endpoint
│   │   │   ├── drafts/        # Drafts list endpoint
│   │   │   ├── sent/          # Sent emails endpoint
│   │   │   └── prompts/       # Prompts configuration endpoint
│   │   ├── page.tsx           # Main application page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── EmailView.tsx      # Email detail view
│   │   ├── Inbox.tsx          # Inbox list component
│   │   ├── Dashboard.tsx      # Dashboard component
│   │   ├── AgentChat.tsx      # AI chat interface
│   │   └── PromptModal.tsx    # Settings/prompts modal
│   ├── data/                  # Data files
│   │   ├── mock-inbox.ts      # Mock email data
│   │   └── default-prompts.ts # Default AI prompts
│   ├── lib/                   # Utility libraries
│   │   ├── store.ts           # In-memory data store
│   │   ├── groq.ts            # Groq API integration
│   │   ├── processing.ts      # Email processing logic
│   │   └── ...
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── package.json              # Dependencies
└── README.md                 # This file
```

---

## 🚀 Deployment

For deployment instructions, see [DEPLOY.md](./DEPLOY.md).

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add `GROQ_API_KEY` as an environment variable
4. Deploy!

**Note:** The application uses an in-memory store for demo purposes. For production, consider connecting a persistent database.

---

## 🐛 Troubleshooting

### Issue: "Failed to process email"
- **Solution**: Check that your `GROQ_API_KEY` is correctly set in `.env.local`
- Verify the API key is valid at [console.groq.com](https://console.groq.com)

### Issue: Mock inbox not loading
- **Solution**: Click "Reset System" in the sidebar, or restart the development server

### Issue: Drafts disappearing
- **Solution**: This has been fixed in the latest version. Drafts now persist until you manually close them or select a different email.

### Issue: Sent emails not appearing
- **Solution**: Ensure the send operation completed successfully. Check the browser console for errors.

---

## 📝 License

This project is part of a demonstration of AI-powered email productivity tools.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues or questions, please open an issue on the GitHub repository.

---

**Made with ❤️ using Groq LPU and Next.js**
