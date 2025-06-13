
"use client";

import type { ReactNode } from 'react';
// import { ThemeProvider } from "next-themes" // Example if you add theme switching

export function AppProviders({ children }: { children: ReactNode }) {
  // Example with ThemeProvider, can be expanded
  // return (
  //   <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  //     {children}
  //   </ThemeProvider>
  // );
  return <>{children}</>;
}
