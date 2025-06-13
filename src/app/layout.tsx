
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Removed as it's not used and causes error
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/app-providers'; // For potential future global providers

export const metadata: Metadata = {
  title: 'Maveric',
  description: 'Customer Feedback Assistant by Maveric',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} antialiased`}> {/* Removed GeistMono.variable */}
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
