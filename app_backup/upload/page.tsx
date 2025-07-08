'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase-browser';
import UploadClient from './UploadClient';

export default function UploadPage() {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.error('❌ Failed to get session:', sessionError);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Failed to load user profile:', profileError.message);
        return;
      }

      if (profile?.first_name) {
        setFirstName(profile.first_name);
      }
    };

    loadProfile();
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 bg-gray-900 text-white">
      {firstName && (
        <h1 className="text-3xl font-bold text-indigo-400 mb-6">
          Welcome back, {firstName}! 👋
        </h1>
      )}
      <UploadClient />
    </main>
  );
}