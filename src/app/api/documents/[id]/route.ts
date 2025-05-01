import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("Attempting to delete document:", id);
    
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

    console.log("Checking document for user:", user.id);
    // Find the document and ensure it belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!document) {
      console.log("Document not found or doesn't belong to user");
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    console.log("Deleting document:", document.id);
    
    // Initialize embeddings and vector store
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      maxConcurrency: 5,
    });

    // Delete from Qdrant first
    try {
      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_ENDPOINT,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: session.user.email,
      });

      // Delete all vectors associated with this document
      // We'll use the document content as a filter to find the vectors
      await vectorStore.delete({
        filter: {
          must: [
            {
              key: "metadata.documentId",
              match: {
                value: id
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error("Error deleting vectors from Qdrant:", error);
      // Continue with document deletion even if Qdrant deletion fails
    }

    // Delete the document from database
    await prisma.document.delete({
      where: {
        id: id,
      },
    });

    console.log("Document deleted successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 