import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'MyCustodyCoach',
  description: 'AI assistant for custody-related questions and court forms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}