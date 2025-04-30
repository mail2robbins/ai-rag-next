import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    // Initialize embeddings and vector store
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      maxConcurrency: 5,
    });

    try {
      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_ENDPOINT,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: session.user.email,
      });

      // Create retriever
      const retriever = vectorStore.asRetriever({
        k: 4,
      });

      // Initialize chat model
      const model = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
        maxRetries: 3,
        maxConcurrency: 5,
      });

      // Create prompt template
      const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the following question based on the provided context. If you cannot find the answer in the context, say "I don't have enough information to answer that question."

        Context: {context}

        Question: {input}
      `);

      // Create document chain
      const documentChain = await createStuffDocumentsChain({
        llm: model,
        prompt,
      });

      // Create retrieval chain
      const chain = await createRetrievalChain({
        combineDocsChain: documentChain,
        retriever,
      });

      // Get response
      const response = await chain.invoke({
        input: message,
      });

      return NextResponse.json({ response: response.answer });
    } catch (error: any) {
      if (error.name === 'InsufficientQuotaError' || error.status === 429) {
        return NextResponse.json(
          { 
            error: "OpenAI API quota exceeded. Please check your billing details or try again later.",
            details: "You've exceeded your current OpenAI API quota. Please check your plan and billing details at https://platform.openai.com/account/billing"
          },
          { status: 429 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { 
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 