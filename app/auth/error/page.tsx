'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params.get('error');

  const errorMessage = {
    CredentialsSignin: 'Invalid email or password.',
    Default: 'Something went wrong. Please try again.',
  }[error ?? 'Default'];

  return (
    <main className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700">{errorMessage}</p>
        <a href="/auth/signin" className="mt-4 inline-block text-blue-600 hover:underline">
          Try signing in again
        </a>
      </div>
    </main>
  );
}