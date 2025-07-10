'use client';

import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Account Settings</h1>
            <p className="text-sm text-green-500 mt-1">✅ Basic version - Working!</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
            >
              ← Back to Coach
            </button>
          </div>
        </div>

        {/* Basic Settings Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                defaultValue="Test User"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                defaultValue="test@example.com"
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <button
            onClick={() => alert('Settings saved! (Test mode)')}
            className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            Save Changes
          </button>
        </div>

        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-semibold">🚧 Settings page is under development</p>
          <p className="text-sm">Full functionality will be restored soon. Basic page rendering is now working!</p>
        </div>
      </div>
    </main>
  );
} 