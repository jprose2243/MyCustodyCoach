'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadPDF = () => {
    const block = document.getElementById('printable-block');
    if (!block || !(window as any).html2pdf) {
      alert('Could not find printable block or html2pdf.js is missing');
      return;
    }

    const opt = {
      margin: 0,
      filename: 'MyCustodyCoach_Response.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'] }
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
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto mt-16 px-4 text-gray-900 bg-white">
      <h1 className="text-3xl font-bold text-center mb-6">MyCustodyCoach</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={6}
          placeholder="Enter your court-related question here..."
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
          {/* Printable Block */}
          <div
            id="printable-block"
            className="mt-8 p-8 border border-gray-300 shadow-md bg-white text-black text-base"
            style={{
              width: '8.5in',
              minHeight: '11in',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              boxSizing: 'border-box'
            }}
          >
            <h2 className="text-xl font-bold mb-4">MyCustodyCoach Response</h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr className="my-4" />
            <p><strong>Response:</strong></p>
            <div>{response}</div>
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