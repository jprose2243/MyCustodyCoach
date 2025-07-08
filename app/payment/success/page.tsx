'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SuccessPage() {
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
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Verification error:', err);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-950 text-white px-4">
      <section className="text-center max-w-md w-full bg-green-900 rounded-xl p-6 shadow">
        {status === 'verifying' && (
          <>
            <p className="text-lg font-medium text-green-200 mb-2">Verifying your payment...</p>
            <p className="text-sm text-green-300">Please wait, this should only take a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-green-400 mb-2">✅ Payment Successful!</h1>
            <p className="mb-4">You now have full access to MyCustodyCoach.</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2 bg-white text-green-900 font-semibold rounded-lg hover:bg-green-200 transition"
            >
              Continue to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-400 mb-2">❌ Payment Verification Failed</h1>
            <p>
              Something went wrong verifying your payment. Please contact support if you were
              charged.
            </p>
          </>
        )}
      </section>
    </main>
  );
}