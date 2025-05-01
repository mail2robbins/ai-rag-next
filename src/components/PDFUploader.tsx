"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";

interface Document {
  id: string;
  name: string;
}

export default function PDFUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      console.log("Fetching documents for user:", session.user.email);
      fetchDocuments();
    }
  }, [session?.user?.email]);

  const fetchDocuments = async () => {
    try {
      console.log("Making request to /api/documents");
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      console.log("Received documents:", data);
      setDocuments(data);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch documents");
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    setError(null);

    try {
      for (const file of acceptedFiles) {
        if (file.type !== "application/pdf") {
          throw new Error("Only PDF files are allowed");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload file");
        }
      }
      // Add a small delay to ensure the document is processed
      setTimeout(fetchDocuments, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
    disabled: uploading,
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          } ${uploading ? "opacity-50" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the PDF files here ...</p>
              ) : (
                <p>Drag and drop PDF files here, or click to select files</p>
              )}
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-600">Processing PDF...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li key={doc.id} className="py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">{doc.name}</span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 