'use client';

import React, { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [fileContext, setFileContext] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, fileContext }),
      });

      const text = await res.text();

      try {
        const data = JSON.parse(text);

        if (res.ok && data.result) {
          console.log('✅ AI Result:', data.result);
          setResponse(data.result);
        } else {
          console.error('⚠️ OpenAI error response:', data.error || 'Unknown error');
          setError(data.error || 'OpenAI returned an empty or invalid response.');
        }
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
        console.error('❌ Raw response text:', text);
        setError('Invalid JSON response from server.');
      }
    } catch (err) {
      console.error('❌ Request failed:', err);
      setError('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        rows={5}
        placeholder="Paste your court question here..."
        className="w-full max-w-2xl bg-zinc-900 text-white p-4 rounded border border-zinc-700 mb-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full max-w-2xl bg-zinc-900 text-white p-2 rounded border border-zinc-700 mb-4"
      >
        <option value="calm">Calm</option>
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
        <option value="direct">Direct</option>
      </select>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded"
      >
        {loading ? 'Generating...' : 'Generate Response'}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <div className="bg-white text-black p-6 mt-6 max-w-2xl w-full rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
          <p className="mb-1"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p className="mb-1"><strong>Tone:</strong> {tone}</p>
          <p className="mb-4"><strong>Question:</strong> {prompt}</p>
          <hr className="my-2" />
          <p className="font-bold mt-2">Response:</p>
          {response.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </main>
  );
}