'use client';

import { useState } from "react";
import { PDFDownloadLink, Document, Page, Text, StyleSheet } from '@react-pdf/renderer';

type Props = {
  user: {
    email: string;
    firstName: string;
    state: string;
  };
};

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  section: { marginBottom: 10 },
  heading: { fontSize: 18, marginBottom: 10 },
  label: { fontWeight: 'bold' },
});

const PdfDocument = ({ prompt, tone, response }: { prompt: string, tone: string, response: string }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.heading}>MyCustodyCoach Response</Text>
      <Text style={styles.section}><Text style={styles.label}>Date:</Text> {new Date().toLocaleDateString()}</Text>
      <Text style={styles.section}><Text style={styles.label}>Tone:</Text> {tone}</Text>
      <Text style={styles.section}><Text style={styles.label}>Question:</Text> {prompt}</Text>
      <Text style={styles.section}><Text style={styles.label}>Response:</Text></Text>
      {response.split("\n").map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </Page>
  </Document>
);

export default function UploadClient({ user }: Props) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("calm");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    if (!uploaded.type.includes("pdf")) {
      setError("❌ Only PDF files are supported.");
      return;
    }

    setFile(uploaded);
    setFileName(uploaded.name);
    setError("");
    console.log("📂 Selected file:", uploaded.name, uploaded.type);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const formData = new FormData();
      formData.append("question", prompt);
      formData.append("tone", tone);
      if (file) formData.append("contextFile", file); // Must match backend

      const res = await fetch("/api/generate-response", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.result) {
        throw new Error(json.error || "AI response failed.");
      }

      setResponse(json.result);
    } catch (err: any) {
      console.error("⚠️ API Error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 p-8 flex flex-col items-center space-y-6">
      <nav className="w-full max-w-4xl flex justify-between items-center py-4">
        <h1 className="text-3xl font-extrabold tracking-tight">MyCustodyCoach</h1>
        <div className="text-sm text-gray-600 text-right">
          <p>{user.firstName || user.email}</p>
          <p className="text-xs text-gray-400">{user.state}</p>
        </div>
      </nav>

      <section className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="prompt" className="block font-semibold mb-1">Court Question</label>
          <textarea
            id="prompt"
            rows={5}
            placeholder="Paste your court question here..."
            className="w-full bg-zinc-100 text-black p-4 rounded border border-zinc-300 focus:outline-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tone" className="block font-semibold mb-1">Tone</label>
          <select
            id="tone"
            className="w-full bg-zinc-100 text-black p-2 rounded border border-zinc-300 focus:outline-blue-500"
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
          <label htmlFor="contextFile" className="block font-semibold mb-1">Upload PDF (Optional)</label>
          <input
            id="contextFile"
            name="contextFile"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {fileName && (
            <p className="mt-2 text-sm text-gray-500">📁 File loaded: {fileName}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </section>

      {response && (
        <section className="bg-white text-black mt-10 p-8 w-full max-w-2xl rounded shadow">
          <h2 className="text-2xl font-bold mb-4">MyCustodyCoach Response</h2>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Tone:</strong> {tone}</p>
          <p><strong>Question:</strong> {prompt}</p>
          <hr className="my-4" />
          <div className="space-y-2 whitespace-pre-wrap">
            {response.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>
      )}

      {response && (
        <PDFDownloadLink
          document={<PdfDocument prompt={prompt} tone={tone} response={response} />}
          fileName="MyCustodyCoach_Response.pdf"
        >
          {({ loading }) =>
            <button className="bg-green-600 hover:bg-green-700 text-white mt-6 py-2 px-6 rounded">
              {loading ? "Preparing PDF..." : "Download PDF"}
            </button>
          }
        </PDFDownloadLink>
      )}
    </main>
  );
}