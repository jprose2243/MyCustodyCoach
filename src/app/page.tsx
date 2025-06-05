'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('calm');
  const [fileText, setFileText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const element = pdfRef.current;

    if (
      typeof window === 'undefined' ||
      !(window as any).html2pdf ||
      !element
    ) {
      alert('PDF export not available. Try again in a moment.');
      return;
    }

    const opt = {
      margin:       0.5,
      filename:     'MyCustodyCoach_Response.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    (window as any).html2pdf().set(opt).from(element).save();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    setFileText('');
    setFileName('');
    setImagePreview('');

    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const maxSizeMB = 5;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setFileError(`File too large. Max size is ${maxSizeMB}MB.`);
      return;
    }

    setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = () => setFileText(reader.result as string);
      reader.readAsText(file);
    } else if (ext === 'docx') {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setFileText(data.text);
        } else {
          setFileError(data.error || 'Failed to process .docx');
        }
      } catch (err) {
        setFileError('Error uploading .docx file.');
      }
    } else if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

          const typedArray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n\n';
          }
          setFileText(text.trim());
        } catch (err) {
          setFileError('Failed to extract text from PDF.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);

        try {
          const Tesseract = await import('tesseract.js');
          const result = await Tesseract.recognize(imageUrl, 'eng');
          setFileText(result.data.text.trim());
        } catch (err) {
          setFileError('Failed to extract text from image.');
        }
      };
      reader.readAsDataURL(file);
    } else {
      setFileError('Unsupported file type. Please upload .txt, .pdf, .docx, or an image.');
    }
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
        body: JSON.stringify({ prompt, tone, fileContext: fileText }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an empty or invalid response.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setResponse(data.result);
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto mt-20 px-4 bg-white text-gray-900 p-6 rounded shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">MyCustodyCoach</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={6}
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

        <input
          type="file"
          accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp"
          onChange={handleFileUpload}
          className="w-full border border-gray-300 p-3 rounded"
        />

        {fileError && <p className="text-red-600 text-sm">{fileError}</p>}

        {imagePreview && (
          <img src={imagePreview} alt="Uploaded preview" className="max-h-40 mx-auto mt-2 rounded shadow" />
        )}

        {fileText && (
          <div className="text-sm text-gray-600 border border-gray-200 bg-gray-50 p-3 rounded">
            <strong>File loaded:</strong> {fileName}
            <pre className="whitespace-pre-wrap mt-2 max-h-40 overflow-auto">
              {fileText.slice(0, 1000)}
              {fileText.length > 1000 && '... (truncated)'}
            </pre>
          </div>
        )}

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
        <div>
          <div
            ref={pdfRef}
            data-download-content=""
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '20px',
              backgroundColor: 'white',
              color: '#111',
              fontSize: '14px',
              lineHeight: '1.6',
              border: '1px solid #ccc',
              marginTop: '24px',
            }}
          >
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr style={{ margin: '12px 0' }} />
            <p><strong>Response:</strong></p>
            <p>{response}</p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="mt-4 w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition"
          >
            Download PDF
          </button>
        </div>
      )}
    </main>
  );
}