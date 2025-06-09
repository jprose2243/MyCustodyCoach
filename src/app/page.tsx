'use client';

import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Calm');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
      }

      const data = await res.json();
      if (!data.result || typeof data.result !== 'string') {
        throw new Error('Invalid JSON format in response.');
      }

      console.log('AI Result Data:', data);
      setResponse(data.result);
    } catch (err: any) {
      console.error('⚠️ OpenAI error response:', err);
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF() {
    if (!window.html2pdf) {
      alert('PDF library not available.');
      return;
    }

    const element = pdfRef.current;
    if (!element) return;

    window.html2pdf().from(element).save('MyCustodyCoach_Response.pdf');
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
        <textarea
          rows={5}
          placeholder="Paste your court question here..."
          className="w-full bg-zinc-900 text-white p-4 rounded border border-zinc-700"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <select
          className="w-full bg-zinc-900 text-white p-2 rounded border border-zinc-700"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          {['Calm', 'Respectful', 'Direct', 'Assertive'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </form>

      {response && (
        <>
          <div ref={pdfRef} className="bg-white text-black mt-10 p-8 w-full max-w-2xl rounded whitespace-pre-wrap shadow-lg">
            <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr className="my-4" />
            <p><strong>Response:</strong></p>
            {response.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white mt-6 py-2 px-6 rounded"
          >
            Download PDF
          </button>
        </>
      )}
    </main>
  );
}