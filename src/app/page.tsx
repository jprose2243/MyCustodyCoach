"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Calm");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    let fileText = "";

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const buffer = await file.arrayBuffer();

      try {
        if (ext === "pdf") {
          const pdfjsLib = await import("pdfjs-dist/build/pdf");
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fileText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
          }
        } else if (["png", "jpg", "jpeg"].includes(ext || "")) {
          const Tesseract = (await import("tesseract.js")).default;
          const { data } = await Tesseract.recognize(file);
          fileText = data.text;
        } else if (["txt", "md"].includes(ext || "")) {
          fileText = await file.text();
        }
      } catch (err) {
        setError("Failed to read file: " + (err as Error).message);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, tone, fileContext: fileText }),
      });
      const json = await res.json();
      if (json.result) setResponse(json.result);
      else setError("Server returned empty or invalid response.");
    } catch (err) {
      setError("Failed to generate response.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const sourceElement = document.querySelector('[data-download-content]');
    if (!sourceElement || !window.html2pdf) return alert("PDF export failed.");
    window.html2pdf().from(sourceElement).set({
      margin: 0.5,
      filename: "MyCustodyCoach_Response.pdf",
      pagebreak: { mode: ["css", "legacy"] },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    }).save();
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 font-sans">
      <h1 className="text-3xl font-bold mb-6">MyCustodyCoach</h1>

      <textarea
        className="w-full h-32 p-3 text-black"
        placeholder="Paste your court question here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <select
        className="w-full mt-3 p-2 text-black"
        value={tone}
        onChange={(e) => setTone(e.target.value)}
      >
        <option>Calm</option>
        <option>Formal</option>
        <option>Supportive</option>
        <option>Cooperative</option>
      </select>

      <input
        type="file"
        ref={fileInputRef}
        className="w-full mt-3 p-2 text-white"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white mt-4 py-2 px-6"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Response"}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {response && (
        <>
          <div
            data-download-content
            className="bg-white text-black mt-8 p-6 w-full max-w-2xl"
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
            className="bg-green-600 hover:bg-green-700 text-white mt-6 py-2 px-6"
          >
            Download PDF
          </button>
        </>
      )}
    </main>
  );
}