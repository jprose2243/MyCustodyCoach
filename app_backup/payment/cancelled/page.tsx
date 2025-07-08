'use client';

export default function CancelledPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <section className="bg-gray-800 rounded-xl shadow p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">
          ❌ Payment Cancelled
        </h1>
        <p className="text-gray-300">
          Your subscription checkout was cancelled. No payment was processed.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          You can try again anytime from your account dashboard.
        </p>
      </section>
    </main>
  );
}