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
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: "MyCustodyCoach_Response.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(pdfRef.current).save();
  };

  return (
    <main className="min-h-screen bg-gray-100 text-black">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">MyCustodyCoach</h1>
          <span className="text-sm text-gray-500 italic">Your AI Assistant for Custody Clarity</span>
        </div>
      </nav>

      <section className="flex flex-col items-center px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold text-center text-gray-800">Get Guidance on Your Custody Questions</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block font-medium mb-1">Court Question</label>
              <textarea
                id="prompt"
                name="prompt"
                rows={5}
                placeholder="Paste your court question here..."
                className="w-full bg-gray-50 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tone" className="block font-medium mb-1">Tone of Voice</label>
              <select
                id="tone"
                name="tone"
                className="w-full bg-gray-50 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label htmlFor="file-upload" className="block font-medium mb-1">Attach File (optional)</label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="w-full bg-gray-50 p-2 border border-gray-300 rounded file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {fileName && <p className="text-sm text-gray-500 mt-1">File loaded: {fileName}</p>}
            </div>
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-medium disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Response"}
          </button>

          {error && <p className="text-red-600 font-medium text-center mt-4">{error}</p>}
        </div>

        {response && (
          <div className="mt-12 w-full max-w-3xl">
            <div ref={pdfRef} className="bg-white rounded-lg shadow p-8 space-y-4">
              <h3 className="text-xl font-bold">MyCustodyCoach Response</h3>
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
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded font-medium mt-6"
            >
              Download PDF
            </button>
          </div>
        )}
      </section>
    </main>
  );
}