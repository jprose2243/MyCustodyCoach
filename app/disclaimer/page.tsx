// app/disclaimer/page.tsx
import React from 'react';

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-indigo-400">Legal Disclaimer</h1>
        <ul className="text-left space-y-3">
          <li><strong>1. No Attorney-Client Relationship –</strong> Using this service does not form an attorney-client relationship.</li>
          <li><strong>2. General Information Only –</strong> Our content is for informational purposes and not legal advice.</li>
          <li><strong>3. Local Laws Vary –</strong> Custody laws differ by state. Always consult a licensed attorney for specific legal advice.</li>
          <li><strong>4. Use at Your Own Risk –</strong> You are responsible for how you use our content and responses.</li>
        </ul>
      </div>
    </main>
  );
}