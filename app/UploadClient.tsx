'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import dynamic from 'next/dynamic';

const PdfDocument = dynamic(() => import('../LegalCoachApp/components/PdfDocument'), {
  ssr: false,
});

export default function UploadClient() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const isValid = validTypes.includes(uploaded.type) || uploaded.type.startsWith('image/');
    if (!isValid) {
      setError('❌ Invalid file type. Upload a PDF, DOCX, TXT, or image.');
      return;
    }

    setFile(uploaded);
    setFileName(uploaded.name);
    setError('');
    console.log('📂 File selected:', uploaded.name);
  };

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit triggered');

    setError('');
    setResponse('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('question', prompt);
      formData.append('tone', tone);
      if (file) formData.append('contextFile', file);

      console.log('📤 Sending FormData to /api/generate-response:', {
        question: prompt,
        tone,
        fileName: file?.name,
      });

      const res = await fetch('/api/generate-response', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('✅ Received from server:', data);

      if (!res.ok || !data.result) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setResponse(data.result);
    } catch (err: any) {
      console.error('⚠️ API Error:', err);
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!response) return alert('No response to export.');

    try {
      const blob = await pdf(
        <PdfDocument prompt={prompt} tone={tone} response={response} />
      ).toBlob();

      saveAs(blob, 'MyCustodyCoach_Response.pdf');
    } catch (err) {
      console.error('❌ PDF export error:', err);
      alert('Failed to generate PDF.');
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 p-8 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6 w-full">
        <nav className="w-full max-w-4xl flex justify-between items-center py-4">
          <h1 className="text-3xl font-extrabold tracking-tight">MyCustodyCoach</h1>
        </nav>

        <section className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="prompt" className="block font-semibold mb-1">
              Court Question
            </label>
            <textarea
              id="prompt"
              rows={5}
              placeholder="Paste your court question here..."
              className="w-full bg-zinc-100 text-black p-4 rounded border border-zinc-300 focus:outline-blue-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="tone" className="block font-semibold mb-1">
              Tone
            </label>
            <select
              id="tone"
              className="w-full bg-zinc-100 text-black p-2 rounded border border-zinc-300 focus:outline-blue-500"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="calm">Calm</option>
              <option value="firm">Firm</option>
              <option value="cooperative">Cooperative</option>
              <option value="empathetic">Empathetic</option>
            </select>
          </div>

          <div>
            <label htmlFor="contextFile" className="block font-semibold mb-1">
              Upload File (PDF, DOCX, TXT, or Image)
            </label>
            <input
              id="contextFile"
              name="contextFile"
              type="file"
              accept=".pdf,.docx,.txt,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {fileName && (
              <p className="mt-2 text-sm text-gray-500">📁 File loaded: {fileName}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full font-semibold py-2 px-6 rounded ${
              loading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Generating...' : 'Generate Response'}
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </section>

        {response && (
          <>
            <section className="bg-white text-black mt-10 p-8 w-full max-w-2xl rounded shadow">
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
              <div className="whitespace-pre-wrap space-y-2">{response}</div>
            </section>

            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white mt-6 py-2 px-6 rounded"
            >
              Download PDF
            </button>
          </>
        )}
      </div>
    </main>
  );
}