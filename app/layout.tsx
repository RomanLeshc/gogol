import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { AppConfigProvider } from '@/components/AppConfigProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ethora Agent Onboarding',
  description: 'Create and manage AI agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppConfigProvider>
          <ThemeProvider>
            {children}
            <ToastProvider />
          </ThemeProvider>
        </AppConfigProvider>
      </body>
    </html>
  );
}

