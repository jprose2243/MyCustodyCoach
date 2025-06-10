"use client";

import { useState, useRef } from "react";
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

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext) return;

    try {
      if (ext === "txt") {
        const text = await file.text();
        setFileText(text);
      } else if (ext === "pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        setFileText(text);
      } else if (ext === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        const plainText = value.replace(/<[^>]+>/g, " ");
        setFileText(plainText);
      } else if (["png", "jpg", "jpeg"].includes(ext)) {
        const Tesseract = await import("tesseract.js");
        const { data } = await Tesseract.recognize(file, "eng");
        setFileText(data.text);
      } else if (ext === "csv" || ext === "rtf") {
        const text = await file.text();
        setFileText(text);
      } else {
        setFileText("Unsupported file type");
      }
    } catch (err: any) {
      console.error("File parsing error:", err);
      setFileText("Error reading file.");
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
    html2pdf()
      .set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: "MyCustodyCoach_Response.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .from(pdfRef.current)
      .save();
  };

  return (
    <main className="min-h-screen bg-white text-black p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        rows={5}
        placeholder="Paste your court question here..."
        className="w-full max-w-2xl bg-zinc-100 text-black p-4 rounded border border-zinc-300 mb-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <select
        className="w-full max-w-2xl bg-zinc-100 text-black p-2 rounded border border-zinc-300 mb-4"
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
        accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.rtf,.csv"
        onChange={handleFileChange}
        className="mb-4"
      />

      {fileName && <p className="mb-2 text-sm text-zinc-500">File loaded: {fileName}</p>}

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6 rounded disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Response"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {response && (
        <>
          <div
            ref={pdfRef}
            className="bg-white text-black mt-10 p-8 w-full max-w-2xl rounded shadow"
          >
            <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tone:</strong> {tone}</p>
            <p><strong>Question:</strong> {prompt}</p>
            <hr className="my-4" />
            <p><strong>Response:</strong></p>
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