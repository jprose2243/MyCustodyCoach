'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase-browser';

export default function PaymentPage() {
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [firstName, setFirstName] = useState('');

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

      // Get user profile for personalization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('questions_used, first_name')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setQuestionsUsed(profile.questions_used || 0);
        setFirstName(profile.first_name || '');
      }
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
      <div className="bg-gray-800 rounded-xl shadow p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-indigo-400">
            {firstName ? `Hi ${firstName}!` : 'Upgrade Required'}
          </h1>
          <p className="text-gray-300">
            {questionsUsed >= 3 
              ? "You've used all 3 free questions. Ready to unlock unlimited access?"
              : "Upgrade to MyCustodyCoach Premium"
            }
          </p>
        </div>

        {/* Trial Summary */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-indigo-300 mb-2">Your Free Trial</h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Questions Used:</span>
            <span className="font-bold text-white">{questionsUsed}/3</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(questionsUsed / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Premium Features */}
        <div className="mb-6">
          <h3 className="font-semibold text-indigo-300 mb-3">Premium Features</h3>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✅</span>
              <span>Unlimited AI-powered responses</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✅</span>
              <span>All 13 tone options (calm, firm, empathetic, etc.)</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✅</span>
              <span>Unlimited document uploads (PDF, DOCX, images)</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✅</span>
              <span>Complete response history</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-400 mr-2">✅</span>
              <span>Priority support</span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-indigo-900/50 border border-indigo-600 rounded-lg p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-indigo-400 mb-1">$20</div>
          <div className="text-gray-300 text-sm">per month</div>
          <div className="text-xs text-gray-400 mt-1">Cancel anytime</div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={!userId || !email || loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition ${
            loading || !userId || !email
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105'
          }`}
        >
          {loading ? 'Starting checkout...' : 'Subscribe Now'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Secure payment powered by Stripe • Cancel anytime
        </p>

        {error && (
          <p className="text-red-400 mt-4 bg-red-900/50 p-3 rounded text-sm border border-red-500 text-center">
            {error}
          </p>
        )}

        {/* Back to app link */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white text-sm underline"
          >
            ← Back to app
          </button>
        </div>
      </div>
    </main>
  );
}