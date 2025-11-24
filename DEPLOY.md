# MailMint AI - Futuristic Email Agent

## 🚀 Vercel Deployment Guide

This project is fully optimized for deployment on Vercel. Follow these steps for a smooth, error-free launch.

### 1. Environment Setup
The project uses Groq LPU for high-speed AI inference. You must configure your API key.

- **GROQ_API_KEY**: `(Your Groq API Key)`

**Getting Your Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

**Important:** Never commit your API key to the repository. Always use environment variables.

### 2. Deployment Steps
1.  Push this code to a GitHub repository.
2.  Log in to Vercel and click **"Add New..."** -> **"Project"**.
3.  Import your repository.
4.  **Framework Preset**: Next.js (Auto-detected)
5.  **Environment Variables**:
    -   Add `GROQ_API_KEY` with your key.
6.  Click **"Deploy"**.

### 3. Post-Deployment
-   The application uses an **In-Memory Store** for this demo. Data (emails, drafts) will reset when the serverless function cold starts or redeploys.
-   For a production version, connect a persistent database like Vercel KV or Postgres in `src/lib/store.ts`.

### 4. Troubleshooting
-   **Internal Server Error**: Usually due to missing API keys or build timeouts. The current build is optimized to run within standard limits.
-   **Styling Issues**: Ensure `postcss` and `tailwindcss` are processed correctly (handled automatically by Vercel).

## ✨ Features
-   **Zero-Latency Interface**: Speculative interaction and optimistic UI.
-   **Agent Swarm**: Multi-persona drafting engine.
-   **Pre-Cog Engine**: Predictive task management.
-   **Neural Network Graph**: 3D visualization of contacts.
-   **Groq LPU Integration**: Llama-3.1-8b (Fast) & Llama-3.3-70b (Smart) hybrid architecture.

