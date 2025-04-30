import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PDFUploader from "@/components/PDFUploader";
import ChatInterface from "@/components/ChatInterface";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Welcome, {session.user?.name}!
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upload PDF Documents
                </h2>
                <PDFUploader />
              </div>
              
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chat with Your Documents
                </h2>
                <ChatInterface />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 