'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const block = document.getElementById('pdf-block');
    if (!block || !(window as any).html2pdf) {
      alert('PDF export failed. Library or content not found.');
      return;
    }

    const opt = {
      margin: 0,
      filename: 'MyCustodyCoach_Response.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait',
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    (window as any).html2pdf().set(opt).from(block).save();
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
        body: JSON.stringify({ prompt, tone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResponse(data.result);
    } catch (err: any) {
      setError(err.message || 'Unexpected error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-900">
      <h1 className="text-3xl font-bold text-center mb-6">MyCustodyCoach</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={5}
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
        <>
          <div
            id="pdf-block"
            style={{
              width: '8.5in',
              minHeight: '11in',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.6',
              padding: '2rem',
              marginTop: '2rem',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              whiteSpace: 'pre-wrap',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>
              MyCustodyCoach Response
            </h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr style={{ margin: '1rem 0' }} />
            <p><strong>Response:</strong></p>
            <p>{response}</p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="mt-6 w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition"
          >
            Download PDF
          </button>
        </>
      )}
    </main>
  );
}