import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
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
    });

    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: session.user.email,
      url: process.env.CHROMA_DB_URL || "http://localhost:8000",
    });

    // Create retriever
    const retriever = vectorStore.asRetriever({
      k: 4,
    });

    // Initialize chat model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
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
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
} 