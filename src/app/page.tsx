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

      setResponse(json.result); // ✅ Renders response to UI
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
      .save("MyCustodyCoach_Response.pdf");
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
        className="w-full max-w-2xl bg-zinc-900 text-white p-2 rounded border border-zinc-700 mb-4"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
      >
        <option value="calm">Calm</option>
        <option value="firm">Firm</option>
        <option value="cooperative">Cooperative</option>
        <option value="empathetic">Empathetic</option>
      </select>

      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        className="mb-4"
      />

      {fileName && (
        <p className="mb-2 text-sm text-zinc-400">
          File loaded: {fileName}
        </p>
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
            className="bg-white text-black mt-10 p-8 w-full max-w-2xl"
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
            <p>
              <strong>Response:</strong>
            </p>
            {response.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
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