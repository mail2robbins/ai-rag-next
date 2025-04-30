# AI PDF Support Agent

A Next.js application that allows users to upload PDF documents and chat with them using AI-powered RAG (Retrieval-Augmented Generation).

## Features

- Authentication with GitHub and Google
- PDF document upload and processing
- Document chunking and embedding using LangChain
- Vector storage using ChromaDB
- Chat interface for interacting with documents
- Powered by Ollama for embeddings and chat

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Ollama running locally (for embeddings and chat)
- GitHub and Google OAuth credentials

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-pdf-support-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/ai_pdf_support"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # GitHub OAuth
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"

   # Google OAuth
   GOOGLE_ID="your-google-client-id"
   GOOGLE_SECRET="your-google-client-secret"
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start Ollama (if not already running):
   ```bash
   # Install Ollama from https://ollama.ai/
   # Pull the llama2 model
   ollama pull llama2
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Visit `http://localhost:3000` in your browser
2. Sign in using GitHub or Google
3. Upload PDF documents using the drag-and-drop interface
4. Ask questions about your documents in the chat interface

## Architecture

- Frontend: Next.js with TailwindCSS
- Authentication: NextAuth.js
- Database: PostgreSQL with Prisma ORM
- Document Processing: LangChain
- Vector Store: ChromaDB
- Embeddings and Chat: Ollama (llama2 model)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
