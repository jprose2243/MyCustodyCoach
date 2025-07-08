'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase-browser';

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [courtState, setCourtState] = useState('');
  const [childAge, setChildAge] = useState('');
  const [parentRole, setParentRole] = useState('');
  const [goalPriority, setGoalPriority] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleSignUp fired');
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName.trim() },
      },
    });

    if (signUpError || !data.user) {
      console.error('❌ Signup error:', signUpError?.message);
      setError(signUpError?.message || 'Signup failed');
      return;
    }

    console.log('✅ Signup success:', data);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (sessionError || !session?.access_token) {
      console.error('❌ Session error:', sessionError?.message);
      setError('Failed to retrieve valid session');
      return;
    }

    console.log('✅ Session retrieved');

    const sessionRes = await fetch('/auth/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: session.access_token }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      console.error('❌ Failed to persist session:', err);
      setError('Failed to persist session');
      return;
    }

    console.log('✅ Session persisted');

    const profilePayload = {
      userId: data.user.id,
      email: email.trim(),
      first_name: firstName.trim(),
      court_state: courtState.trim(),
      child_age: Number(childAge),
      parent_role: parentRole.trim(),
      goal_priority: goalPriority.trim(),
    };

    console.log('📤 Sending profile payload:', profilePayload);

    const profileRes = await fetch('/api/init-user-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profilePayload),
    });

    if (!profileRes.ok) {
      const debugText = await profileRes.text();
      console.error('❌ Profile init failed:', debugText);
      setError('Failed to initialize user profile');
      return;
    }

    console.log('✅ Redirecting to /payment');
    router.push('/payment');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <form onSubmit={handleSignUp} className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Sign Up for <span className="text-indigo-400">MyCustodyCoach</span>
        </h1>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <input
          type="text"
          placeholder="First Name"
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <select
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={courtState}
          onChange={(e) => setCourtState(e.target.value)}
          required
        >
          <option value="">Select State of Court Case</option>
          {STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Child's Age"
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={childAge}
          onChange={(e) => setChildAge(e.target.value)}
          required
        />

        <select
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={parentRole}
          onChange={(e) => setParentRole(e.target.value)}
          required
        >
          <option value="">Select Parent Role</option>
          <option value="father">Father</option>
          <option value="mother">Mother</option>
        </select>

        <select
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={goalPriority}
          onChange={(e) => setGoalPriority(e.target.value)}
          required
        >
          <option value="">Select Goal</option>
          <option value="50/50 custody">50/50 Custody</option>
          <option value="primary custody">Primary Custody</option>
          <option value="protective orders">Protective Orders</option>
          <option value="relocation">Relocation</option>
        </select>

        <input
          type="email"
          placeholder="you@example.com"
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition"
        >
          Create Account
        </button>
      </form>
    </main>
  );
}