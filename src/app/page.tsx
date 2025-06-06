'use client';

import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileContext, setFileContext] = useState('');
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'txt') {
        const text = await file.text();
        setFileContext(text.slice(0, 1000));
      } else if (ext === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setFileContext(text.slice(0, 1000));
      } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
        const Tesseract = await import('tesseract.js');
        const {
          data: { text },
        } = await Tesseract.recognize(file, 'eng');
        setFileContext(text.slice(0, 1000));
      } else {
        alert('Unsupported file type.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to extract text from file.');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, fileContext }),
      });

      const json = await res.json();
      if (!res.ok || !json.result) throw new Error('Bad response');
      setResponse(json.result);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '800px';
    clone.style.padding = '20px';
    clone.style.color = '#000';
    clone.style.fontSize = '14px';
    clone.style.background = '#fff';

    const paragraphs = clone.querySelectorAll('p');
    paragraphs.forEach((p) => {
      p.style.marginBottom = '0.8rem';
      p.style.lineHeight = '1.6';
    });

    const opt = {
      margin: 0,
      filename: 'MyCustodyCoach_Response.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    html2pdf().from(clone).set(opt).save();
  };

  return (
    <main className="min-h-screen p-6 bg-black text-white font-sans">
      <h1 className="text-3xl font-bold text-center mb-6 text-white">MyCustodyCoach</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your court question here..."
        className="w-full p-4 rounded border border-gray-700 bg-gray-900 text-white"
        rows={5}
      />

      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full mt-4 p-3 rounded border border-gray-700 bg-gray-900 text-white"
      >
        <option value="calm">Tone: Calm</option>
        <option value="firm">Tone: Firm</option>
        <option value="cooperative">Tone: Cooperative</option>
      </select>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.pdf,.png,.jpg,.jpeg"
        className="w-full mt-4 p-3 rounded border border-gray-700 bg-gray-900 text-white"
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full mt-4 p-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

      {response && (
        <>
          <div
            id="pdf-content"
            className="mt-8 bg-white text-black p-8 rounded shadow-lg mx-auto max-w-3xl"
          >
            <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
            <p>
              <strong>Tone:</strong> {tone}
            </p>
            <p>
              <strong>Question:</strong> {prompt}
            </p>
            <hr className="my-4" />
            <p className="whitespace-pre-line leading-7">
              <strong>Response:</strong> {response}
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full mt-6 p-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition"
          >
            Download PDF
          </button>
        </>
      )}
    </main>
  );
}