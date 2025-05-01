"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const callbackUrl = searchParams.get("callbackUrl");

  // Debug information (only in development)
  const isDevelopment = process.env.NODE_ENV === "development";
  const debugInfo = isDevelopment ? {
    error,
    errorDescription,
    callbackUrl,
    googleId: process.env.NEXT_PUBLIC_GOOGLE_ID ? "Set" : "Not Set",
    githubId: process.env.NEXT_PUBLIC_GITHUB_ID ? "Set" : "Not Set",
    nextAuthUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
  } : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error === 'google' && (
              <span>
                There was an error signing in with Google. Please check your Google OAuth configuration.
              </span>
            )}
            {error === 'github' && (
              <span>
                There was an error signing in with GitHub. Please check your GitHub OAuth configuration.
              </span>
            )}
            {error !== 'google' && error !== 'github' && (
              <span>
                There was an error during authentication. Please try again.
              </span>
            )}
            {errorDescription && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm">
                <p className="font-semibold text-red-800">Error Details:</p>
                <p className="mt-1 text-red-600">{errorDescription}</p>
              </div>
            )}
          </p>
        </div>
        {isDevelopment && debugInfo && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <p className="font-semibold">Debug Info:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Error: {debugInfo.error}</li>
              <li>Error Description: {debugInfo.errorDescription || 'None'}</li>
              <li>Callback URL: {debugInfo.callbackUrl}</li>
              <li>Google ID: {debugInfo.googleId}</li>
              <li>GitHub ID: {debugInfo.githubId}</li>
              <li>NextAuth URL: {debugInfo.nextAuthUrl}</li>
            </ul>
          </div>
        )}
        <div className="mt-8">
          <a
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 