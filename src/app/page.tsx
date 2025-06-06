"use client";

import { useState, useRef } from "react";

// debug: trigger redeploy with final text layout

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("calm");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    setError("");
    setResponse("");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, fileContext: "" })
      });

      const data = await res.json();
      console.log("Client received:", data);

      if (data.result) {
        setResponse(data.result);
      } else {
        setError(data.error || "Unknown error from API.");
      }
    } catch (err) {
      console.error("Client error:", err);
      setError("Client error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const content = pdfRef.current;
    if (!content || !window.html2pdf) {
      alert("PDF export is not ready.");
      return;
    }

    const opt = {
      margin: 0.5,
      filename: "MyCustodyCoach_Response.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait"
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    window.html2pdf().set(opt).from(content).save();
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach PDF Export</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Paste your court question here..."
        className="w-full max-w-2xl p-4 mb-4 text-black rounded"
        rows={5}
      />

      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full max-w-2xl p-2 mb-4 text-black rounded"
      >
        <option value="calm">Tone: Calm</option>
        <option value="firm">Tone: Firm</option>
        <option value="empathetic">Tone: Empathetic</option>
        <option value="neutral">Tone: Neutral</option>
        <option value="cooperative">Tone: Cooperative</option>
      </select>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded mb-4"
      >
        {loading ? "Generating..." : "Generate Response"}
      </button>

      {error && (
        <p className="text-red-400 mt-4">{error}</p>
      )}

      {response && (
        <>
          <div
            ref={pdfRef}
            className="bg-white text-black p-6 w-full max-w-2xl rounded mb-6"
            data-download-content
          >
            <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr className="my-2" />
            <p><strong>Response:</strong></p>
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
        </>
      )}
    </main>
  );
}