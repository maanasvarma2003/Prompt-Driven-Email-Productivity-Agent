# MailMint AI (Groq Edition)

**MailMint AI** is an advanced, high-efficiency email productivity agent powered by **Groq LPU** for millisecond-speed processing and generation.

## 🚀 Features

-   **Ultra-Fast AI**: Uses **Groq LPU** (`llama3-8b` / `llama3-70b`) for instant results.
-   **Smart Drafts**: One-click drafting that saves to your Drafts folder.
-   **Semantic Inbox**: Search your emails instantly.
-   **Dashboard**: Visual analytics of your inbox status.
-   **Agent Chat**: Full RAG-based chat assistant.

## 🛠 Setup Instructions

1.  **Get Groq API Key (Required)**
    -   Sign up at [console.groq.com](https://console.groq.com).
    -   Create a new API Key.

2.  **Configure Environment**
    -   Create a `.env.local` file in the root directory.
    -   Add your key:
        ```env
        GROQ_API_KEY=gsk_...
        ```

3.  **Run the App**
    ```bash
    npm install
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## 💡 Usage Tips

-   **Drafts**: Click "Draft Reply" in the email view. Drafts appear instantly.
-   **Search**: Type in the inbox search bar to filter by subject, sender, or content instantly.
-   **Performance**: Powered by Groq LPU, responses are typically sub-second.
