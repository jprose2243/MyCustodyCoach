"use client";

import { useState, useRef } from "react";
import html2pdf from "html2pdf.js";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("calm");
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDownloadPDF = () => {
    if (!window.html2pdf || !pdfRef.current) {
      alert("PDF export not available.");
      return;
    }
    window.html2pdf()
      .from(pdfRef.current)
      .set({ margin: 10, filename: "MyCustodyCoach_Response.pdf", html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } })
      .save();
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        rows={5}
        id="prompt"
        name="prompt"
        placeholder="Paste your court question here..."
        className="w-full max-w-2xl bg-zinc-900 text-white p-4 rounded border border-zinc-700 mb-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <select
        id="tone"
        name="tone"
        className="w-full max-w-2xl bg-zinc-900 text-white p-2 rounded border border-zinc-700 mb-4"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
      >
        <option value="calm">Calm</option>
        <option value="firm">Firm</option>
        <option value="cooperative">Cooperative</option>
        <option value="empathetic">Empathetic</option>
      </select>

      <label className="w-full max-w-2xl mb-4">
        <span className="block text-sm text-zinc-400 mb-1">Upload Background File (optional)</span>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
        />
      </label>

      {fileName && (
        <p className="mb-2 text-sm text-zinc-400">File loaded: {fileName}</p>
      )}

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Response"}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <>
          <div
            ref={pdfRef}
            className="bg-white text-black mt-10 p-8 w-full max-w-2xl rounded shadow font-serif border border-gray-300"
          >
            <h2 className="text-3xl font-bold text-center mb-6">MyCustodyCoach Response</h2>
            <p className="mb-2"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p className="mb-2"><strong>Tone:</strong> {tone}</p>
            <p className="mb-4"><strong>Question:</strong> {prompt}</p>
            <hr className="my-4" />
            <p className="font-semibold text-lg mb-4">Response:</p>
            {response.split("\n").map((line, i) => (
              <p key={i} className="mb-2 leading-relaxed">{line}</p>
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