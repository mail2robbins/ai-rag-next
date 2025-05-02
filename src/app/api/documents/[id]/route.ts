import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { QdrantClient } from "@qdrant/js-client-rest";

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
      include: {
        vectors: true
      }
    });

    if (!document) {
      console.log("Document not found or doesn't belong to user");
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    console.log("Deleting document:", document.id);
    
    // Delete from Qdrant first
    try {
      if (!process.env.QDRANT_ENDPOINT || !process.env.QDRANT_API_KEY) {
        throw new Error("Qdrant configuration is missing");
      }

      console.log("Qdrant endpoint:", process.env.QDRANT_ENDPOINT);
      
      const qdrant = new QdrantClient({
        url: process.env.QDRANT_ENDPOINT,
        apiKey: process.env.QDRANT_API_KEY,
        timeout: 10000, // 10 seconds timeout
      });

      const collectionName = session.user.email;
      console.log("Deleting vectors from Qdrant collection:", collectionName);

      // Delete points one by one using their IDs
      if (document.vectors && document.vectors.length > 0) {
        console.log(`Found ${document.vectors.length} vectors to delete`);
        for (const vector of document.vectors) {
          try {
            await qdrant.delete(collectionName, {
              points: [vector.pointId]
            });
            console.log(`Deleted point ${vector.pointId}`);
          } catch (error) {
            console.error(`Error deleting point ${vector.pointId}:`, error);
          }
        }
      }

    } catch (error) {
      console.error("Error deleting from Qdrant:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      // Continue with document deletion even if Qdrant deletion fails
    }

    // Delete the document from database (this will cascade delete the vectors)
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