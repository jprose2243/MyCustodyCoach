'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [tone, setTone] = useState('Calm');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg'
  ];

  const handleUpload = async () => {
    if (!file) return setStatus('❌ No file selected');

    if (!acceptedTypes.includes(file.type)) {
      return setStatus('❌ Unsupported file type');
    }

    setIsUploading(true);
    setStatus('📤 Uploading file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setStatus(res.ok ? '✅ File uploaded successfully!' : `❌ Upload failed: ${data.error || 'Unknown error'}`);
    } catch (err) {
      console.error(err);
      setStatus('❌ Upload failed. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateResponse = async () => {
    if (!question) {
      return setStatus('❌ Please enter a question.');
    }

    setIsGenerating(true);
    setStatus('🤖 Generating response...');
    setResponse('');

    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, tone }),
      });

      const data = await res.json();
      setStatus(res.ok ? '' : `❌ Error: ${data.error || 'Something went wrong'}`);
      setResponse(data.answer || '[No response returned]');
    } catch (err) {
      console.error(err);
      setStatus('❌ Request failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">MyCustodyCoach</h1>
      <p className="text-gray-500 mb-4">Your AI Assistant for Custody Clarity</p>

      <label className="block mb-1 font-medium">Court Question</label>
      <textarea
        className="w-full border border-gray-300 rounded p-2 mb-4"
        rows={4}
        placeholder="Paste your court question here..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <label className="block mb-1 font-medium">Tone</label>
      <select
        className="w-full border border-gray-300 rounded p-2 mb-4"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
      >
        <option>Calm</option>
        <option>Assertive</option>
        <option>Factual</option>
        <option>Reassuring</option>
      </select>

      <label className="block mb-1 font-medium">Upload Context (Optional)</label>
      <input
        type="file"
        accept=".pdf,.docx,.txt,.png,.jpg"
        className="mb-2"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 w-full mb-4 disabled:opacity-50"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>

      <button
        onClick={handleGenerateResponse}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Response'}
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