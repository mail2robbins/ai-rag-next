import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
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
    // Delete the document
    await prisma.document.delete({
      where: {
        id: id,
      },
    });

    // Also delete from Qdrant
    // TODO: Implement Qdrant deletion if needed

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