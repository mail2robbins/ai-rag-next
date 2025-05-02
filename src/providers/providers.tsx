"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children, session }: { children: React.ReactNode; session: any }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
} 