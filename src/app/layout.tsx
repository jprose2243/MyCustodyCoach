import './globals.css';

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
      <body className="font-sans antialiased">
        {children}

        {/* ✅ PDF Export Library via CDN */}
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
          defer
        ></script>
      </body>
    </html>
  );
}