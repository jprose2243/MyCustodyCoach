"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("calm");
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setFileText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, fileContext: fileText }),
      });

      let json;
      try {
        json = await res.json();
      } catch (e) {
        throw new Error("Invalid JSON received from API");
      }

      if (!res.ok || !json.result) {
        throw new Error(json.error || "Failed to get response");
      }

      setResponse(json.result);
    } catch (err: any) {
      console.error("⚠️ OpenAI error response:", err);
      setError(err.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !pdfRef.current) {
      alert("PDF export not available.");
      return;
    }

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: "MyCustodyCoach_Response.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(pdfRef.current).save();
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 p-8 flex flex-col items-center space-y-6">
      <nav className="w-full max-w-4xl flex justify-between items-center py-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          MyCustodyCoach
        </h1>
        <p className="text-sm text-gray-500 hidden sm:block">
          Your AI Assistant for Custody Clarity
        </p>
      </nav>

      <section className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="prompt" className="block font-semibold mb-1">
            Court Question
          </label>
          <textarea
            id="prompt"
            name="prompt"
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
            name="tone"
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
          <label htmlFor="file-upload" className="block font-semibold mb-1">
            Upload Context (Optional)
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {fileName && (
            <p className="mt-2 text-sm text-gray-500">File loaded: {fileName}</p>
          )}
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </section>

      {response && (
        <section
          ref={pdfRef}
          className="bg-white text-black mt-10 p-8 w-full max-w-2xl rounded shadow"
        >
          <h2 className="text-2xl font-bold mb-4">
            MyCustodyCoach Response
          </h2>
          <p>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </p>
          <p className="mt-1">
            <strong>Tone:</strong> {tone}
          </p>
          <p className="mt-1">
            <strong>Question:</strong> {prompt}
          </p>
          <hr className="my-4" />
          <p className="font-semibold mb-2">Response:</p>
          <div className="space-y-2">
            {response.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>
      )}

      {response && (
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white mt-6 py-2 px-6 rounded"
        >
          Download PDF
        </button>
      )}
    </main>
  );
}