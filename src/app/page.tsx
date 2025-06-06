"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Calm");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, tone }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Unexpected error");
      }

      setResponse(json.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !window.html2pdf) {
      alert("PDF library not available.");
      return;
    }

    const element = pdfRef.current;
    if (!element) return;

    // Clone visible block and apply light theme for export
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.background = "#fff";
    clone.style.color = "#000";
    clone.style.padding = "32px";
    clone.style.maxWidth = "700px";
    clone.style.margin = "0 auto";
    clone.style.fontSize = "14px";
    clone.style.lineHeight = "1.6";
    clone.querySelectorAll("h2").forEach(h => (h.style.textAlign = "center"));

    const opt = {
      margin:       0,
      filename:     "MyCustodyCoach_Response.pdf",
      image:        { type: "jpeg", quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak:    { mode: ["avoid-all", "css", "legacy"] },
    };

    window.html2pdf().set(opt).from(clone).save();
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        rows={5}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your court question here..."
        className="w-full max-w-2xl bg-zinc-900 text-white p-4 rounded border border-zinc-700 mb-4"
      />

      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full max-w-2xl bg-zinc-900 text-white p-2 rounded border border-zinc-700 mb-4"
      >
        <option>Calm</option>
        <option>Confident</option>
        <option>Professional</option>
        <option>Empathetic</option>
        <option>Assertive</option>
      </select>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Response"}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <div
          ref={pdfRef}
          className="bg-white text-black mt-8 p-6 w-full max-w-2xl rounded shadow-lg text-[14px]"
          data-download-content
        >
          <h2 className="text-2xl font-bold text-center mb-4">MyCustodyCoach Response</h2>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Tone:</strong> {tone}</p>
          <p><strong>Question:</strong> {prompt}</p>
          <hr className="my-4" />
          <p><strong>Response:</strong></p>
          {response.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
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