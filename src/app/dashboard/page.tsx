"use client";

import { useSession } from "next-auth/react";
import PDFUploader from "@/components/PDFUploader";
import ChatInterface from "@/components/ChatInterface";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
          Welcome back, {session?.user?.name}
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Upload and chat with your PDF documents
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Upload Documents
          </h2>
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800">
            <PDFUploader />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Chat with Documents
          </h2>
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
            <ChatInterface />
          </div>
        </div>
      </motion.div>
    </div>
  );
} 