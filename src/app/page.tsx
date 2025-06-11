"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

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

    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      if (extension === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        setFileText(text);
      } else if (extension === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setFileText(result.value);
      } else if (extension === "txt") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === "string") {
            setFileText(event.target.result);
          }
        };
        reader.readAsText(file);
      } else {
        throw new Error("Unsupported file type");
      }
    } catch (err) {
      setError("Error reading file: " + (err as Error).message);
      setFileText("");
    }
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
    <main className="min-h-screen bg-gray-100 text-black p-4 flex flex-col items-center">
      <header className="w-full max-w-4xl flex flex-col items-center py-8">
        <h1 className="text-4xl font-bold mb-2">MyCustodyCoach</h1>
        <p className="text-lg text-gray-600">
          Your AI Assistant for Custody Clarity
        </p>
      </header>

      <section className="w-full max-w-2xl bg-white shadow p-6 rounded space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium">
            Your Question
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows={5}
            className="mt-1 w-full bg-zinc-100 p-4 rounded border border-zinc-300 focus:outline-none focus:ring focus:ring-blue-300"
            placeholder="Paste your court question here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tone" className="block text-sm font-medium">
            Tone
          </label>
          <select
            id="tone"
            name="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="mt-1 w-full bg-zinc-100 p-2 rounded border border-zinc-300"
          >
            <option value="calm">Calm</option>
            <option value="firm">Firm</option>
            <option value="cooperative">Cooperative</option>
            <option value="empathetic">Empathetic</option>
          </select>
        </div>

        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium">
            Upload Evidence
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileChange}
            className="mt-1"
          />
          {fileName && (
            <p className="text-sm text-gray-500 mt-1">File loaded: {fileName}</p>
          )}
        </div>

        {error && <p className="text-red-600 mt-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>
      </section>

      {response && (
        <section className="w-full max-w-2xl bg-white mt-10 p-8 rounded shadow" ref={pdfRef}>
          <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Tone:</strong> {tone}</p>
          <p><strong>Question:</strong> {prompt}</p>
          <hr className="my-4" />
          <p><strong>Response:</strong></p>
          {response.split("\n").map((line, i) => (
            <p key={i} className="mb-2">{line}</p>
          ))}
          <button
            onClick={handleDownloadPDF}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Download PDF
          </button>
        </section>
      )}
    </main>
  );
}