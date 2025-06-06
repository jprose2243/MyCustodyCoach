'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pdfRef = useRef<HTMLDivElement | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate/route', {
        method: 'POST',
        body: JSON.stringify({ prompt, tone }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Something went wrong.');
      setResponse(json.result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!pdfRef.current) return;

    try {
      const html2pdf = (window as any).html2pdf;

      html2pdf()
        .set({
          margin: 0,
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
        })
        .from(pdfRef.current)
        .save();
    } catch (err) {
      alert('PDF export failed.');
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4 text-center">MyCustodyCoach</h1>

      <textarea
        rows={4}
        placeholder="Paste your court question here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full max-w-2xl p-3 text-black rounded mb-2"
      />

      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full max-w-2xl p-2 text-black rounded mb-2"
      >
        <option value="calm">Tone: Calm</option>
        <option value="firm">Tone: Firm</option>
        <option value="cooperative">Tone: Cooperative</option>
      </select>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white mt-2 px-6 py-2 rounded"
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <>
          <div
            ref={pdfRef}
            className="bg-white text-black mt-6 p-6 w-full max-w-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr className="my-2" />
            <p><strong>Response:</strong></p>
            {response.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>

          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded mt-4"
          >
            Download PDF
          </button>
        </>
      )}
    </main>
  );
}