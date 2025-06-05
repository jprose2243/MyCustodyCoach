import './globals.css';
import { GeistSans, GeistMono } from 'geist/font';

export const metadata = {
  title: 'MyCustodyCoach',
  description: 'AI assistant for custody-related questions and court forms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}

        {/* ✅ PDF Export Library - html2pdf.js */}
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
          defer
        ></script>
      </body>
    </html>
  );
}