import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'MyCustodyCoach',
  description: 'AI assistant for custody-related questions and court forms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans antialiased flex flex-col min-h-screen">
        <Providers>
          <div className="flex-grow">{children}</div>

          <footer className="text-center text-sm text-gray-500 dark:text-gray-400 p-6 border-t border-gray-200 dark:border-gray-700 mt-10">
            <p className="space-x-4">
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <span>·</span>
              <Link href="/disclaimer" className="hover:underline">Disclaimer</Link>
            </p>
            <p className="mt-2 text-xs">&copy; {new Date().getFullYear()} MyCustodyCoach</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}