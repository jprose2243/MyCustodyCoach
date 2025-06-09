'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileContext, setFileContext] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    setError('');
    setResponse('');
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, tone, fileContext }),
      });

      const data = await res.json();

      console.log('📥 AI Result Data:', data); // ✅ PATCHED LINE

      if (!res.ok || !data.result) {
        throw new Error(data.error || 'Unexpected error.');
      }

      setResponse(data.result);
    } catch (err: any) {
      console.error('UI error:', err);
      setError(err.message || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setFileContext(text.slice(0, 3000));
  };

  const handleDownloadPDF = async () => {
    if (typeof window === 'undefined' || !window.html2pdf) {
      alert('PDF library not available.');
      return;
    }

    const element = document.querySelector('[data-download-content]');
    if (!element) return;

    window.html2pdf().from(element).save('MyCustodyCoach_Response.pdf');
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        rows={5}
        placeholder="Paste your court question here..."
        className="w-full max-w-2xl bg-zinc-900 text-white p-4 rounded border border-zinc-700 mb-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <select
        className="w-full max-w-2xl bg-zinc-900 text-white p-2 rounded border border-zinc-700 mb-4"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
      >
        <option value="calm">Calm</option>
        <option value="firm">Firm</option>
        <option value="supportive">Supportive</option>
      </select>

      <input
        type="file"
        accept=".txt,.md"
        className="mb-4"
        onChange={handleFileUpload}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <div
          data-download-content
          className="bg-white text-black mt-8 p-6 w-full max-w-2xl rounded shadow-md"
          ref={pdfRef}
        >
          <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Tone:</strong> {tone}</p>
          <p><strong>Question:</strong> {prompt}</p>
          <hr className="my-2" />
          <p><strong>Response:</strong></p>
          {response.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {response && (
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white mt-6 py-2 px-6 rounded"
        >
          Download PDF
        </button>
      )}
    </main>
  );
}