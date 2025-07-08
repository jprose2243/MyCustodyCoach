'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !loginData.session) {
      console.error('❌ Login error:', error?.message);
      setErrorMsg(error?.message || 'Login failed');
      setLoading(false);
      return;
    }

    console.log('✅ Login successful:', loginData.session.user.id);

    // ✅ Persist session via /auth/set
    const sessionRes = await fetch('/auth/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: loginData.session.access_token }),
    });

    if (!sessionRes.ok) {
      const debug = await sessionRes.text();
      console.error('❌ Failed to persist session:', debug);
      setErrorMsg('Session persistence failed.');
      setLoading(false);
      return;
    }

    // ✅ Check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', loginData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Failed to fetch user profile:', profileError?.message);
      setErrorMsg('Failed to load user data.');
      setLoading(false);
      return;
    }

    console.log('🔐 Subscription status:', profile.subscription_status);

    // ✅ Redirect based on subscription
    if (profile.subscription_status === true) {
      router.push('/upload');
    } else {
      router.push('/payment');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400">
          Log In to MyCustodyCoach
        </h1>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {errorMsg && (
          <p className="text-red-600 bg-red-100 px-3 py-2 rounded text-sm border border-red-300">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${
            loading
              ? 'bg-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
          }`}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </main>
  );
}