'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Calm');
  const [response, setResponse] = useState('');
  const [fileContext, setFileContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pdfRef = useRef<HTMLDivElement>(null);

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, fileContext }),
      });

      // ✅ Check status code
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
      }

      // ✅ Ensure response is JSON
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        throw new Error('Failed to parse JSON response from server.');
      }

      console.log('🎯 API Result Data:', data);

      if (data.result) {
        setResponse(data.result);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unknown response format.');
      }
    } catch (err: any) {
      console.error('⚠️ UI error:', err);
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (typeof window === 'undefined' || !window.html2pdf) {
      alert('PDF library not available.');
      return;
    }

    const element = document.querySelector('[data-download-content]');
    if (!element) {
      alert('No content found to export.');
      return;
    }

    const opt = {
      margin:       0.5,
      filename:     'MyCustodyCoach_Response.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save();
  }

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
        <option>Calm</option>
        <option>Confident</option>
        <option>Empathetic</option>
        <option>Professional</option>
      </select>

      <input
        type="file"
        accept=".txt"
        className="mb-4"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setFileContext(reader.result as string);
            reader.readAsText(file);
          }
        }}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && (
        <p className="text-red-400 mt-4 text-sm max-w-xl text-center">
          {error}
        </p>
      )}

      {response && (
        <div
          data-download-content
          ref={pdfRef}
          className="bg-white text-black mt-6 p-6 w-full max-w-2xl rounded shadow"
        >
          <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Tone:</strong> {tone.toLowerCase()}</p>
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