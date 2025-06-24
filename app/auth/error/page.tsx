'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}

function ErrorContent() {
  const params = useSearchParams();
  const errorCode = params.get('error') || 'Default';

  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Invalid email or password.',
    OAuthSignin: 'OAuth sign-in failed. Please try again.',
    OAuthCallback: 'OAuth callback error.',
    EmailCreateAccount: 'Unable to create account using email.',
    Default: 'Something went wrong. Please try again.',
  };

  const message = errorMessages[errorCode] || errorMessages['Default'];

  return (
    <main className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center" role="alert" aria-live="assertive">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700">{message}</p>
        <a
          href="/auth/signin"
          className="mt-4 inline-block text-blue-600 hover:underline font-medium"
        >
          Try signing in again
        </a>
      </div>
    </main>
  );
}