import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Session user email:", session.user.email);
    
    // First get the user's ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      console.log("User not found in database for email:", session.user.email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("Found user:", user);

    // Check if any documents exist
    const documentCount = await prisma.document.count({
      where: {
        userId: user.id,
      },
    });

    console.log("Total documents for user:", documentCount);

    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log("Found documents:", documents);
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
} 