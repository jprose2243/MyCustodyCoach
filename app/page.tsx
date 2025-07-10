'use client';

import UploadClient from './UploadClient';

// Force deployment refresh - enhanced UI with side-by-side layout
export default function UploadPage() {
  return (
    <main className="min-h-screen px-4 py-6 bg-gray-900 text-white">
      <UploadClient />
    </main>
  );
}