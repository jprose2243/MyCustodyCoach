'use client';

export default function Home() {
  const handleDownloadPDF = () => {
    if (
      typeof window === 'undefined' ||
      !(window as any).html2pdf
    ) {
      alert('html2pdf not available');
      return;
    }

    const element = document.getElementById('test-pdf');
    if (!element) {
      alert('Target not found');
      return;
    }

    const opt = {
      margin: 0,
      filename: 'Test_Output.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff'
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    (window as any).html2pdf()
      .set(opt)
      .from(element)
      .save();
  };

  return (
    <main className="p-10 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">PDF Export Test</h1>

      <div
        id="test-pdf"
        style={{
          width: '8.5in',
          minHeight: '11in',
          backgroundColor: '#fff',
          padding: '1in',
          fontSize: '14px',
          color: '#000',
          lineHeight: '1.6',
          boxSizing: 'border-box'
        }}
      >
        <h2>Hello PDF Export</h2>
        <p>This content should render inside the PDF.</p>
        <p>It is styled inline and sits on a visible DOM element.</p>
        <p>
          This test proves whether html2pdf can generate a valid page using
          html2canvas → jsPDF pipeline.
        </p>
        <p style={{ pageBreakBefore: 'always' }}>
          Page 2 — using page break CSS.
        </p>
        <p>
          If this works, the issue lies with conditional rendering or invisible
          refs in your original version.
        </p>
      </div>

      <button
        onClick={handleDownloadPDF}
        className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700"
      >
        Download Test PDF
      </button>
    </main>
  );
}