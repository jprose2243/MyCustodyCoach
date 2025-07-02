'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createClientComponentClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ Signup error:', error.message);
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    console.log('✅ Signup successful');

    // ✅ Extract user ID and call init-user-profile
    try {
      const userId = data.user?.id;
      if (!userId) throw new Error('Missing user ID after signup');

      const res = await fetch('/api/init-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) {
        throw new Error('Failed to initialize user profile');
      }

      console.log('✅ User profile initialized');
    } catch (err: any) {
      console.error('❌ Error creating user_profile:', err.message);
    }

    router.push('/');
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400">
          Sign Up for MyCustodyCoach
        </h1>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </main>
  );
}