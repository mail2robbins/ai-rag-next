import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Chroma } from "langchain/vectorstores/chroma";
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

    // Load PDF
    const loader = new PDFLoader(buffer);
    const docs = await loader.load();

    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    // Create embeddings and store in ChromaDB
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await Chroma.fromDocuments(splitDocs, embeddings, {
      collectionName: session.user.email,
      url: process.env.CHROMA_DB_URL || "http://localhost:8000",
    });

    // Store document metadata in database
    await prisma.document.create({
      data: {
        name: file.name,
        content: docs.map((doc) => doc.pageContent).join("\n"),
        userId: session.user.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
} 