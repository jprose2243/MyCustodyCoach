// app/privacy/page.tsx
import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-indigo-400">Privacy Policy</h1>
        <p>This explains how we collect, use, and protect your data.</p>
        <ul className="text-left space-y-3">
          <li><strong>1. What We Collect –</strong> Email, profile info, uploaded documents, AI question logs, and usage data.</li>
          <li><strong>2. How We Use It –</strong> To personalize responses, improve accuracy, detect abuse, and improve your experience.</li>
          <li><strong>3. Sharing –</strong> We only share data with trusted services (e.g. Supabase, OpenAI) or when required by law.</li>
          <li><strong>4. Your Rights –</strong> Contact privacy@mycustodycoach.com to access, delete, or update your data.</li>
          <li><strong>5. Security & Retention –</strong> We store data securely and retain it only as long as necessary.</li>
        </ul>
      </div>
    </main>
  );
}