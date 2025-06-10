"use client";

import { useRef, useState } from "react";
import html2pdf from "html2pdf.js";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("calm");
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
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

      const json = await res.json();

      if (!res.ok || !json.result) {
        throw new Error(json.error || "Failed to get response");
      }

      setResponse(json.result);
    } catch (err: any) {
      console.error("⚠️ OpenAI error:", err);
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

    const opt = {
      margin: [0.0, 0.0, 0.0, 0.0],
      filename: "MyCustodyCoach_Response.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(pdfRef.current).save();
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8">MyCustodyCoach</h1>

      <form className="w-full max-w-2xl flex flex-col gap-4">
        <label htmlFor="prompt" className="text-sm text-gray-400">
          Your Court Question
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={5}
          placeholder="Paste your court question here..."
          className="bg-zinc-900 text-white p-4 rounded border border-zinc-700"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <label htmlFor="tone" className="text-sm text-gray-400">
          Desired Tone
        </label>
        <select
          id="tone"
          name="tone"
          className="bg-zinc-900 text-white p-2 rounded border border-zinc-700"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option value="calm">Calm</option>
          <option value="firm">Firm</option>
          <option value="cooperative">Cooperative</option>
          <option value="empathetic">Empathetic</option>
        </select>

        <label htmlFor="file-upload" className="text-sm text-gray-400">
          Upload Optional Background File
        </label>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="bg-zinc-900 text-white p-2 rounded border border-zinc-700"
        />
        {fileName && (
          <p className="text-sm text-gray-400 mt-1">File loaded: {fileName}</p>
        )}

        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>

        {error && <p className="text-red-400">{error}</p>}
      </form>

      {response && (
        <section className="mt-10 w-full max-w-2xl flex flex-col items-center gap-6">
          <div
            ref={pdfRef}
            className="bg-white text-black p-8 w-full border shadow-md"
          >
            <h2 className="text-2xl font-bold mb-4">
              MyCustodyCoach Response
            </h2>
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
            <p className="font-semibold">Response:</p>
            {response.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
          >
            Download PDF
          </button>
        </section>
      )}
    </main>
  );
}