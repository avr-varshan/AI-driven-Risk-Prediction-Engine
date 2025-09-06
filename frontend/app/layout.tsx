import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChronicCare Monitor',
  description: 'AI-powered chronic care patient monitoring and readmission risk assessment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
            <ChatDrawer />
            <Toaster />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}