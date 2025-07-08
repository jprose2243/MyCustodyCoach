'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

export default function PaymentPage() {
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.error('❌ Failed to get Supabase session:', error);
        setError('Not logged in. Please refresh or sign in again.');
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? '');
    };

    loadUser();
  }, []);

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);
    console.log('🟣 Starting checkout...');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('❌ Checkout error:', text);
        setError('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('✅ Checkout session:', data);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('No checkout URL returned.');
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <div className="bg-gray-800 rounded-xl shadow p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-indigo-400">Upgrade to Unlimited Access</h1>
        <p className="mb-6">
          You’ve used your 3 free questions. Unlock full access to MyCustodyCoach for just{' '}
          <strong>$20/month</strong>.
        </p>
        <button
          onClick={handleSubscribe}
          disabled={!userId || !email || loading}
          className={`w-full py-2 px-6 rounded-lg font-semibold transition ${
            loading || !userId || !email
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {loading ? 'Starting checkout...' : 'Subscribe Now'}
        </button>

        {error && (
          <p className="text-red-400 mt-4 bg-red-900/50 p-2 rounded text-sm border border-red-500">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}