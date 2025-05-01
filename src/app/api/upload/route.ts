import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const blob = new Blob([buffer], { type: 'application/pdf' });

    // Load PDF
    const loader = new PDFLoader(blob);
    const docs = await loader.load();

    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    // Create embeddings and store in Qdrant
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      maxConcurrency: 5,
    });

    try {
      const vectorStore = await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
        url: process.env.QDRANT_ENDPOINT,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: session.user.email,
      });

      // Store document metadata in database
      await prisma.document.create({
        data: {
          name: file.name,
          content: docs
            .map((doc) => doc.pageContent)
            .join("\n")
            .replace(/\0/g, '') // Remove null bytes
            .slice(0, 4000), // Limit content size to prevent database issues
          userId: user.id, // Use the user's ID instead of email
        },
      });

      return NextResponse.json({ success: true });
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
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { 
        error: "Failed to process PDF",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 