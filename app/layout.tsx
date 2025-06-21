import "./globals.css"; // ✅ Corrected import

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MyCustodyCoach",
  description: "AI assistant for custody-related questions and court forms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}