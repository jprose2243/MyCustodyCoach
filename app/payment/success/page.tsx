'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessPageContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('🔍 sessionId from URL:', sessionId);

    if (!sessionId) {
      setStatus('error');
      console.error('❌ No session_id found in URL.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const raw = await res.text();
        console.log('🧪 Raw /api/verify-payment response:', raw);

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          console.error('❌ Failed to parse JSON:', err);
          setStatus('error');
          return;
        }

        console.log('✅ Parsed response:', parsed);

        if (parsed?.success) {
          setStatus('success');
          // Auto-redirect to main interface after 2 seconds
          setTimeout(() => {
            router.push('/upload');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Verification error:', err);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-950 text-white px-4">
      <section className="text-center max-w-md w-full bg-green-900 rounded-xl p-6 shadow">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-green-200 mb-2">Verifying your payment...</p>
            <p className="text-sm text-green-300">Please wait, this should only take a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-green-400 mb-4">Payment Successful!</h1>
            <p className="mb-4 text-green-200">
              Welcome to MyCustodyCoach Premium! You now have unlimited access to our AI assistant.
            </p>
            <div className="bg-green-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-200">
                ✅ Unlimited AI responses<br/>
                ✅ All tone options<br/>
                ✅ Document uploads<br/>
                ✅ Full response history
              </p>
            </div>
            <p className="text-sm text-green-300 mb-4">
              Redirecting you to the main interface in a moment...
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-2 bg-white text-green-900 font-semibold rounded-lg hover:bg-green-200 transition"
            >
              Continue to MyCustodyCoach
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-400 mb-4">Payment Verification Failed</h1>
            <p className="mb-4 text-red-200">
              Something went wrong verifying your payment. Please contact support if you were charged.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/payment')}
                className="w-full px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/upload')}
                className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
              >
                Continue to App
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center bg-green-950 text-white px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-green-200">Loading...</p>
      </main>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}