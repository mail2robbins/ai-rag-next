import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Sign in attempt:", { 
        user, 
        account, 
        profile,
        googleId: process.env.GOOGLE_ID,
        googleSecret: process.env.GOOGLE_SECRET ? "Set" : "Not Set",
        githubId: process.env.GITHUB_ID,
        githubSecret: process.env.GITHUB_SECRET ? "Set" : "Not Set",
        nextAuthUrl: process.env.NEXTAUTH_URL,
        baseUrl: process.env.NEXTAUTH_URL || "http://localhost:3000"
      });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { 
        url, 
        baseUrl,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        isRelative: url.startsWith("/"),
        isSameOrigin: new URL(url).origin === baseUrl
      });
      
      // If the URL is relative, prepend the base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If the URL is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Otherwise, redirect to the base URL
      return baseUrl;
    },
    async session({ session, token, user }) {
      console.log("Session callback:", { 
        session, 
        token, 
        user,
        hasToken: !!token,
        hasUser: !!user
      });
      return session;
    },
    async jwt({ token, account, user, profile }) {
      console.log("JWT callback:", { 
        token, 
        account, 
        user, 
        profile,
        hasAccount: !!account,
        hasUser: !!user,
        hasProfile: !!profile
      });
      return token;
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("Sign in event:", { user, account, profile });
    },
    async signOut({ session, token }) {
      console.log("Sign out event:", { session, token });
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", { code, metadata });
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      console.log("NextAuth Debug:", { code, metadata });
    }
  }
}