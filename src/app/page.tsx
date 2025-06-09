'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Calm');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileText, setFileText] = useState('');
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const text = await file.text();
    setFileText(text);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, fileContext: fileText }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Unknown error from API');
      }

      setResponse(json.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (typeof window === 'undefined' || !window.html2pdf) {
      alert('PDF library not available.');
      return;
    }

    const element = document.querySelector('[data-download-content]');
    if (!element) {
      alert('PDF content not found.');
      return;
    }

    window.html2pdf()
      .set({
        margin: 0.5,
        filename: 'MyCustodyCoach_Response.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(element)
      .save();
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        rows={5}
        className="w-full max-w-2xl bg-zinc-900 text-white p-4 rounded border border-zinc-700 mb-4"
        placeholder="Paste your court question here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <select
        className="w-full max-w-2xl bg-zinc-900 text-white p-2 rounded border border-zinc-700 mb-4"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
      >
        <option value="Calm">Calm</option>
        <option value="Assertive">Assertive</option>
        <option value="Professional">Professional</option>
      </select>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="mb-4 text-sm"
      />

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <>
          <div
            ref={pdfRef}
            data-download-content
            className="bg-white text-black mt-8 p-6 w-full max-w-2xl rounded"
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