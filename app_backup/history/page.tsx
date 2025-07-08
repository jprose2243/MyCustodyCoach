import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HistoryPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    console.warn('🔒 Unauthorized access attempt or missing session');
    redirect('/login'); // 🔐 Auth required
  }

  const userId = session.user.id;

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch session history:', error.message);
    return <div className="p-6 text-red-600">Failed to load history.</div>;
  }

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-indigo-600 dark:text-indigo-400">
          MyCustodyCoach History
        </h1>

        {sessions.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No previous sessions found.
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow ring-1 ring-gray-200 dark:ring-gray-700"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <strong>Date:</strong>{' '}
                  {new Date(entry.created_at).toLocaleDateString()}
                </p>
                <p className="mb-2">
                  <strong>Tone:</strong> {entry.tone}
                </p>
                <p className="mb-2">
                  <strong>Question:</strong> {entry.question}
                </p>
                {entry.file_name && (
                  <p className="mb-2">
                    <strong>File:</strong>{' '}
                    <a
                      href={entry.file_url}
                      className="text-indigo-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {entry.file_name}
                    </a>
                  </p>
                )}
                <hr className="my-2 border-gray-300 dark:border-gray-600" />
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {entry.response}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}