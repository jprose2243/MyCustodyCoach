'use client';

import { useState, useEffect } from 'react';

export default function UploadClient() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const userId = 'demo-user-001'; // Replace later with real auth user ID

  useEffect(() => {
    if (file) {
      console.log('🧾 File state updated:', file.name, file.size);
    }
  }, [file]);

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
    console.log('📂 File selected:', uploaded.name);
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
      console.error('❌ Supabase upload failed:', data);
      throw new Error('File upload failed.');
    }

    console.log('✅ Uploaded to Supabase:', data.url);
    return encodeURI(data.url);
  };

  const handleSubmit = async () => {
    setError('');
    setResponse('');
    setLoading(true);

    try {
      await new Promise((res) => setTimeout(res, 150));
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

      const res = await fetch('/api/generate-response', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('✅ Server response:', data);

      if (
        !res.ok ||
        !data.result ||
        typeof data.result !== 'string' ||
        data.result.trim().length < 10
      ) {
        throw new Error('No meaningful response received. Try rephrasing your question or re-uploading.');
      }

      setResponse(data.result.trim());
    } catch (err: any) {
      console.error('❌ Submission error:', err);
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-6 py-10 font-sans">
        <nav className="flex justify-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
            MyCustodyCoach
          </h1>
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
              className="w-full p-4 text-lg leading-relaxed bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all"
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
              className="w-full p-3 text-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all"
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
              name="contextFile"
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
            className={`w-full py-3 px-6 text-lg font-semibold rounded-xl transition-all duration-200 focus:outline-none active:scale-95 ${
              loading
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg'
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

        {response && response.length > 10 && (
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