'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase-browser';

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
  const [childrenCount, setChildrenCount] = useState('');
  const [parentRole, setParentRole] = useState('');
  const [goalPriority, setGoalPriority] = useState<string[]>([]);
  const [goalDropdownTouched, setGoalDropdownTouched] = useState(false);
  const [error, setError] = useState('');

  const goalOptions = [
    '50/50 custody',
    'primary custody', 
    'child support modification',
    'visitation enforcement',
    'co-parenting communication',
    'protective orders',
    'relocation'
  ];

  const handleGoalChange = (goal: string) => {
    setGoalPriority(prev => {
      if (prev.includes(goal)) {
        // Remove goal if already selected
        return prev.filter(g => g !== goal);
      } else if (prev.length < 3) {
        // Add goal if under limit
        return [...prev, goal];
      }
      // Do nothing if at limit
      return prev;
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleSignUp fired');
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (goalPriority.length === 0) {
      setError('Please select at least one goal');
      return;
    }

    try {
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

      // Wait for session to be available
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (sessionError || !session?.access_token) {
        console.error('❌ Session error:', sessionError?.message);
        setError('Failed to retrieve valid session');
        return;
      }

      console.log('✅ Session retrieved');

      // Persist session
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

      // Initialize user profile
      const profilePayload = {
        userId: data.user.id,
        email: email.trim(),
        first_name: firstName.trim(),
        court_state: courtState.trim(),
        child_age: Number(childAge),
        children_count: childrenCount.trim(),
        parent_role: parentRole.trim(),
        goal_priority: goalPriority.join(', '),
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

      console.log('✅ Redirecting to /upload for free trial');
      router.push('/');
    } catch (error) {
      console.error('❌ Unexpected signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <form onSubmit={handleSignUp} className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Sign Up for <span className="text-indigo-400">MyCustodyCoach</span>
        </h1>
        
        <div className="bg-green-900/50 border border-green-600 rounded-lg p-3 text-center">
          <p className="text-green-200 text-sm">
            🎉 <strong>Start your free trial!</strong> Get 3 free AI-powered responses to test our service.
          </p>
        </div>

        <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3">
          <p className="text-blue-200 text-sm font-medium mb-1">
            Is my information secure?
          </p>
          <p className="text-blue-100 text-xs">
            Yes, MyCustodyCoach takes protecting and securing your personal data very seriously—it&apos;s our main priority. We use industry-standard security practices and encryption to safeguard your information and case details, which are never shared with third parties.
          </p>
        </div>

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

        <select
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={childAge}
          onChange={(e) => setChildAge(e.target.value)}
          required
        >
          <option value="">Child&apos;s Age (oldest if multiple)</option>
          {Array.from({ length: 20 }, (_, i) => (
            <option key={i} value={i.toString()}>{i} years old</option>
          ))}
        </select>

        <select
          className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
          value={childrenCount}
          onChange={(e) => setChildrenCount(e.target.value)}
          required
        >
          <option value="">How many children?</option>
          <option value="1">1 child</option>
          <option value="2">2 children</option>
          <option value="3">3 children</option>
          <option value="4">4 children</option>
          <option value="5">5 children</option>
          <option value="6+">6 or more children</option>
        </select>

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

        <div className="relative">
          <select
            className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
            value=""
            onChange={(e) => {
              setGoalDropdownTouched(true);
              if (e.target.value && !goalPriority.includes(e.target.value)) {
                handleGoalChange(e.target.value);
                e.target.value = "";
              }
            }}
            onFocus={() => setGoalDropdownTouched(true)}
          >
            <option value="" disabled>
              {goalPriority.length === 0 
                ? "Choose your goals (up to 3)" 
                : `Selected ${goalPriority.length}/3 goals - Add more`}
            </option>
            {goalOptions.map((goal) => (
              <option 
                key={goal} 
                value={goal}
                disabled={goalPriority.includes(goal) || goalPriority.length >= 3}
              >
                {goal.charAt(0).toUpperCase() + goal.slice(1)}
                {goalPriority.includes(goal) ? " ✓" : ""}
              </option>
            ))}
          </select>
          
          {goalPriority.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {goalPriority.map((goal) => (
                <span
                  key={goal}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white"
                >
                  {goal.charAt(0).toUpperCase() + goal.slice(1)}
                  <button
                    type="button"
                    onClick={() => handleGoalChange(goal)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-700 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {goalDropdownTouched && goalPriority.length === 0 && (
            <div className="text-red-400 text-xs mt-1">Please select at least one goal</div>
          )}
        </div>

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
          Start Free Trial
        </button>
        
        <p className="text-xs text-gray-400 text-center">
          No credit card required • 3 free questions • Upgrade anytime
        </p>
      </form>
    </main>
  );
}