'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const acceptedTypes = ['application/pdf'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = (e.target as HTMLInputElement)?.files?.[0];
    if (!uploaded) return;

    if (!acceptedTypes.includes(uploaded.type)) {
      setStatus('❌ Only PDF files are supported.');
      setFile(null);
      return;
    }

    setFile(uploaded);
    setStatus(`📎 File ready: ${uploaded.name}`);
  };

  const handleGenerateResponse = async () => {
    if (!question.trim()) {
      setStatus('❌ Please enter a question.');
      return;
    }

    setLoading(true);
    setStatus('🤖 Generating response...');
    setResponse('');

    try {
      const formData = new FormData();
      formData.append('question', question.trim());
      formData.append('tone', tone.toLowerCase());
      if (file) formData.append('contextFile', file);

      const res = await fetch('/api/generate-response', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.result) {
        throw new Error(data.error || 'AI failed to respond.');
      }

      setResponse(data.result);
      setStatus('✅ Response ready!');
    } catch (err: any) {
      console.error('❌ Error during fetch:', err);
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">MyCustodyCoach</h1>
      <p className="text-gray-500 mb-4">Your AI Assistant for Custody Clarity</p>

      <label htmlFor="question" className="block mb-1 font-medium">Court Question</label>
      <textarea
        id="question"
        name="question"
        className="w-full border border-gray-300 rounded p-2 mb-4"
        rows={4}
        placeholder="Paste your court question here..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <label htmlFor="tone" className="block mb-1 font-medium">Tone</label>
      <select
        id="tone"
        name="tone"
        className="w-full border border-gray-300 rounded p-2 mb-4"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
      >
        <option value="calm">Calm</option>
        <option value="assertive">Assertive</option>
        <option value="factual">Factual</option>
        <option value="reassuring">Reassuring</option>
      </select>

      <label htmlFor="contextFile" className="block mb-1 font-medium">Upload PDF (Optional)</label>
      <input
        id="contextFile"
        name="contextFile"
        type="file"
        accept=".pdf"
        className="mb-2"
        onChange={handleFileChange}
      />

      <button
        onClick={handleGenerateResponse}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {status && (
        <p className={`mt-4 text-sm ${status.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {status}
        </p>
      )}

      {response && (
        <div className="mt-6 p-4 border rounded bg-gray-50 whitespace-pre-wrap">
          <h2 className="text-lg font-semibold mb-2">MCC Response</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}