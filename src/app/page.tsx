'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [fileText, setFileText] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      if (file.type === 'application/pdf') {
        setFileText('[PDF detected. PDF parsing not yet enabled in browser — coming soon.]');
      } else {
        setFileText(reader.result as string);
      }
    };

    if (file.type === 'application/pdf') {
      setFileText('[Parsing PDF — please wait...]');
      reader.readAsArrayBuffer(file); // placeholder
    } else {
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          tone,
          fileContext: fileText
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setResponse(data.result);
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto mt-20 px-4 bg-white text-gray-900 p-6 rounded shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">MyCustodyCoach</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={6}
          placeholder="Paste your court question here..."
          className="w-full p-3 border border-gray-300 rounded"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />

        <select
          className="w-full p-3 border border-gray-300 rounded"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option value="calm">Tone: Calm</option>
          <option value="firm">Tone: Firm</option>
          <option value="cooperative">Tone: Cooperative</option>
        </select>

        <input
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileUpload}
          className="w-full border border-gray-300 p-3 rounded"
        />

        {fileText && (
          <div className="text-sm text-gray-600 border border-gray-200 bg-gray-50 p-3 rounded">
            <strong>File context loaded:</strong>
            <pre className="whitespace-pre-wrap mt-2 max-h-40 overflow-auto">{fileText.slice(0, 1000)}{fileText.length > 1000 && '... (truncated)'}</pre>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {response && (
        <div className="mt-6 p-4 bg-white text-gray-900 border border-gray-300 rounded whitespace-pre-wrap shadow-md">
          {response}
        </div>
      )}
    </main>
  );
}