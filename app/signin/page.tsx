'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect /signin to /login
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  );
} 