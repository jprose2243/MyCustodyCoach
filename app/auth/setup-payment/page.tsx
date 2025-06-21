'use client';

import { useRouter } from 'next/navigation';

export default function SetupPaymentPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Set Up Your Payment Method
        </h1>

        <p className="text-gray-600 mb-6">
          You have 5 free searches to get started. You can skip this step for now
          and come back anytime to add your payment details.
        </p>

        {/* Placeholder for future Stripe integration */}
        <div className="border border-dashed border-gray-300 rounded p-6 mb-6 text-gray-400">
          Stripe form will go here.
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-200"
        >
          Skip for Now
        </button>
      </div>
    </main>
  );
}