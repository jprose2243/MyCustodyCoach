'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [fileContext, setFileContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const text = await file.text();

    if (ext === 'pdf') {
      const pdfjsLib = await import('pdfjs-dist/build/pdf');
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      const typedArray = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      let content = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        content += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setFileContext(content);
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToPlainText({ arrayBuffer });
      setFileContext(result.value);
    } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      const Tesseract = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(file);
      setFileContext(data.text);
    } else {
      setFileContext(text);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, fileContext }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setResponse(data.result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF() {
    const exportBlock = document.querySelector('[data-download-content]');
    if (!exportBlock || !window.html2pdf) {
      alert('PDF export failed: missing content or library.');
      return;
    }

    const options = {
      margin: 0,
      filename: 'MyCustodyCoach_Response.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    window.html2pdf().set(options).from(exportBlock).save();
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your court question here..."
        className="w-full max-w-xl p-4 mb-4 rounded text-black"
        rows={5}
      />
      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full max-w-xl p-2 mb-4 text-black"
      >
        <option value="calm">Tone: Calm</option>
        <option value="cooperative">Tone: Cooperative</option>
        <option value="firm">Tone: Firm</option>
        <option value="emotional">Tone: Emotional</option>
      </select>
      <input
        type="file"
        accept=".txt,.pdf,.docx,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <>
          <div
            data-download-content
            className="bg-white text-black mt-8 p-6 w-full max-w-2xl"
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
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white mt-6 py-2 px-6"
          >
            Download PDF
          </button>
        </>
      )}
    </main>
  );
}