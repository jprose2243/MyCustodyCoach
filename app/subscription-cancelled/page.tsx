'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase-browser';

export default function SubscriptionCancelledPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setEmail(session.user.email || '');
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          setFirstName(profile.first_name || '');
        }
      }
    };

    fetchUserInfo();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Sad but understanding emoji */}
        <div className="text-6xl mb-6">😔</div>
        
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Subscription Cancelled
        </h1>
        
        {firstName && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're sorry to see you go, {firstName}.
          </p>
        )}
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
            What happens next?
          </h2>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left">
            <li>• Your subscription has been cancelled</li>
            <li>• You'll receive a confirmation email shortly</li>
            <li>• Your account remains active until the end of your billing period</li>
            <li>• You can reactivate anytime from your settings</li>
          </ul>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-green-800 dark:text-green-400 mb-2">
            We'd love your feedback
          </h2>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            Help us improve MyCustodyCoach for other parents like you.
          </p>
          <button
            onClick={() => router.push('/support')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
          >
            Share Feedback
          </button>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/upload')}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            Continue Using MyCustodyCoach
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
          >
            Sign Out
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Need help with custody matters?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Even without a subscription, these resources can help:
          </p>
          <div className="space-y-2 text-sm">
            <a 
              href="https://www.childwelfare.gov/topics/systemwide/courts/custody/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Child Welfare Information Gateway
            </a>
            <a 
              href="https://www.courts.ca.gov/selfhelp-custody.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Self-Help Legal Resources
            </a>
            <a 
              href="https://www.legalaid.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Find Legal Aid in Your Area
            </a>
          </div>
        </div>
      </div>
    </main>
  );
} 