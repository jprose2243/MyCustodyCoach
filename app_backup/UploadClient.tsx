'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

export default function UploadClient() {
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [courtState, setCourtState] = useState('');
  const [childAge, setChildAge] = useState('');
  const [goalPriority, setGoalPriority] = useState('');
  const [parentRole, setParentRole] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        console.error('❌ No Supabase session:', sessionError);
        setError('You are not logged in.');
        return;
      }

      const id = session.user.id;
      setUserId(id);

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('first_name, court_state, child_age, goal_priority, parent_role')
        .eq('id', id)
        .single();

      if (profileError) {
        console.error('❌ Failed to load profile:', profileError.message);
        return;
      }

      if (profile) {
        setFirstName(profile.first_name || '');
        setCourtState(profile.court_state || '');
        setChildAge(profile.child_age || '');
        setGoalPriority(profile.goal_priority || '');
        setParentRole(profile.parent_role || '');
      }
    };

    fetchSessionAndProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const isValid = validTypes.includes(uploaded.type) || uploaded.type.startsWith('image/');
    if (!isValid) {
      setError('❌ Invalid file type. Upload a PDF, DOCX, TXT, or image.');
      return;
    }

    setFile(uploaded);
    setFileName(uploaded.name);
    setError('');
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const sanitizedName = file.name.replace(/\s+/g, '-');
    const renamedFile = new File([file], sanitizedName, { type: file.type });

    const formData = new FormData();
    formData.append('file', renamedFile);
    formData.append('userId', userId);

    const res = await fetch('/api/upload-to-supabase', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data?.url) {
      throw new Error('File upload failed.');
    }

    return encodeURI(data.url);
  };

  const handleSubmit = async () => {
    setError('');
    setResponse('');
    setLoading(true);

    try {
      if (!userId) throw new Error('❌ You must be logged in to submit a question.');
      if (file && file.size === 0) {
        throw new Error('⚠️ Uploaded file is empty or not fully loaded yet.');
      }

      let uploadedFileUrl = '';
      if (file) {
        uploadedFileUrl = await uploadToSupabase(file);
      }

      const formData = new FormData();
      formData.append('question', prompt.trim());
      formData.append('tone', tone);
      formData.append('fileUrl', uploadedFileUrl);
      formData.append('userId', userId);

      const res = await fetch('/api/generate-response', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.result || typeof data.result !== 'string' || data.result.trim().length < 10) {
        throw new Error('No meaningful response received. Try rephrasing your question or re-uploading.');
      }

      const finalResult = data.result.trim();
      setResponse(finalResult);

      // ✅ Save log to Supabase sessions
      const { error: insertError } = await supabase.from('sessions').insert({
        user_id: userId,
        prompt: prompt.trim(),
        tone,
        file_url: uploadedFileUrl || null,
        result: finalResult,
      });

      if (insertError) {
        console.error('⚠️ Failed to log session:', insertError.message);
      } else {
        console.log('📊 Response logged to Supabase.');
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    `Help me prepare for a hearing in ${courtState} as a ${parentRole} of a ${childAge}-year-old.`,
    `How can I respond to gatekeeping behavior and still pursue ${goalPriority}?`,
    `Write a calm reply to an accusatory message about my parenting time.`,
  ];

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-6 py-10 font-sans">
        <nav className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">MyCustodyCoach</h1>
          {firstName && (
            <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
              <span>👋 Hi {firstName} ({courtState})</span>
              <button
                onClick={handleSignOut}
                className="ml-2 px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-xs"
              >
                Sign Out
              </button>
            </div>
          )}
        </nav>

        <section className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 space-y-6 ring-1 ring-gray-200 dark:ring-gray-700">
          <div>
            <label htmlFor="prompt" className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
              Court Question
            </label>
            <textarea
              id="prompt"
              rows={5}
              placeholder="Paste your court question here..."
              className="w-full p-4 text-lg leading-relaxed bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="tone" className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
              Tone
            </label>
            <select
              id="tone"
              className="w-full p-3 text-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="calm">Calm</option>
              <option value="firm">Firm</option>
              <option value="cooperative">Cooperative</option>
              <option value="empathetic">Empathetic</option>
            </select>
          </div>

          <div>
            <label htmlFor="contextFile" className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
              Upload File (PDF, DOCX, TXT, or Image)
            </label>
            <input
              id="contextFile"
              type="file"
              accept=".pdf,.docx,.txt,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
            />
            {fileName && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">📁 File loaded: {fileName}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 px-6 text-lg font-semibold rounded-xl transition-all duration-200 ${
              loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {loading ? 'Generating...' : 'Generate Response'}
          </button>

          {error && (
            <p className="bg-yellow-50 text-red-700 border border-yellow-300 rounded-md px-4 py-2 text-sm mt-2">
              {error}
            </p>
          )}
        </section>

        {examplePrompts.length > 0 && (
          <section className="bg-indigo-50 dark:bg-gray-800 p-5 rounded-xl shadow-inner text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-2 text-indigo-700 dark:text-indigo-300">
              Example Prompts Based on Your Profile:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {examplePrompts.map((p, i) => (
                <li key={i} className="hover:underline cursor-pointer" onClick={() => setPrompt(p)}>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        {response && (
          <section className="bg-green-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-6 rounded-2xl shadow-md space-y-4">
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              MyCustodyCoach Response
            </h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr className="border-t border-gray-300 dark:border-gray-600" />
            <div className="whitespace-pre-wrap text-base leading-relaxed">{response}</div>
          </section>
        )}
      </div>
    </main>
  );
}