// app/terms/page.tsx
import React from 'react';

export default function TermsPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-indigo-400">Terms of Service</h1>
        <p>By accessing or using MyCustodyCoach, you agree to the following terms:</p>
        <ul className="text-left space-y-3">
          <li><strong>1. License & Use –</strong> You are granted a limited, non-exclusive, non-transferable license to use the platform. Do not misuse it.</li>
          <li><strong>2. No Legal Advice –</strong> We do not provide legal advice. Nothing on this platform constitutes legal representation.</li>
          <li><strong>3. Termination –</strong> We reserve the right to terminate accounts for policy violations or misuse.</li>
          <li><strong>4. Governing Law –</strong> This agreement is governed by Colorado state law.</li>
          <li><strong>5. Liability –</strong> We are not liable for any damages resulting from use of this site. Use at your own risk.</li>
        </ul>
      </div>
    </main>
  );
}