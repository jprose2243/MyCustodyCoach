'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

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

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate response');
      }

      setResponse(json.result);
    } catch (err: any) {
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

    const element = pdfRef.current;
    if (!element) return;

    const opt = {
      margin: [0.75, 0.75],
      filename: 'MyCustodyCoach_Response.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait',
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    window.html2pdf().set(opt).from(element).save();
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col gap-4">
        <textarea
          className="bg-gray-900 p-4 rounded resize-none text-white"
          rows={5}
          placeholder="Paste your court question here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <select
          className="bg-gray-900 p-3 rounded text-white"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option value="calm">Tone: Calm</option>
          <option value="confident">Tone: Confident</option>
          <option value="respectful">Tone: Respectful</option>
          <option value="cooperative">Tone: Cooperative</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <div ref={pdfRef} className="bg-white text-black mt-8 p-6 w-full max-w-2xl rounded shadow-md" data-download-content>
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