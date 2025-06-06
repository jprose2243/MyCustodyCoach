'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const pdfRef = useRef<HTMLDivElement | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');

      setResponse(data.result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate response.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!pdfRef.current) return alert('Nothing to export!');
    try {
      const element = pdfRef.current;
      const html2pdf = (window as any).html2pdf;

      html2pdf()
        .set({
          margin: 0.5,
          filename: 'MyCustodyCoach_Response.pdf',
          pagebreak: { mode: ['css', 'legacy'] },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
          },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } catch (err) {
      console.error(err);
      alert('Something went wrong while trying to download the PDF.');
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center gap-4">
      <h1 className="text-3xl font-bold text-center mt-4">MyCustodyCoach</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your court question here..."
        className="w-full max-w-2xl p-3 rounded border border-gray-600 bg-gray-900 text-white h-32 resize-none"
      />

      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full max-w-2xl p-2 rounded border border-gray-600 bg-gray-900 text-white"
      >
        <option value="calm">Tone: Calm</option>
        <option value="formal">Tone: Formal</option>
        <option value="assertive">Tone: Assertive</option>
        <option value="cooperative">Tone: Cooperative</option>
      </select>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && (
        <p className="text-red-400 mt-4">{error}</p>
      )}

      {response && (
        <>
          <div
            ref={pdfRef}
            data-download-content
            className="bg-white text-black mt-8 p-6 w-full max-w-2xl text-base leading-relaxed rounded shadow-md"
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