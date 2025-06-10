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

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !pdfRef.current) {
      alert("PDF export not available.");
      return;
    }

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [0, 0, 0, 0],
      filename: "MyCustodyCoach_Response.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    html2pdf().set(opt).from(pdfRef.current).save();
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        id="prompt"
        name="prompt"
        rows={5}
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

      <input
        id="file-upload"
        name="file-upload"
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        className="mb-4"
      />

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
            className="bg-white text-black mt-10 p-8 w-full max-w-2xl rounded shadow leading-relaxed space-y-4"
          >
            <h2 className="text-2xl font-bold">MyCustodyCoach Response</h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr className="my-4 border-gray-400" />
            <div>
              <p className="font-semibold mb-2">Response:</p>
              {response.split("\n").map((line, i) => (
                <p key={i} className="text-base">{line}</p>
              ))}
            </div>
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