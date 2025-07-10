import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractTextFromPDF(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Set workerSrc to the file URL of the worker for Node.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).href;
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let extractedText = '';
  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    extractedText += pageText + '\n';
  }
  return extractedText;
}

(async () => {
  const pdfPath = path.join(__dirname, 'tests', 'assets', 'sample.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('Sample PDF not found:', pdfPath);
    process.exit(1);
  }
  const buffer = fs.readFileSync(pdfPath);
  try {
    const text = await extractTextFromPDF(buffer);
    console.log('Extracted text:\n', text);
    if (text.includes('MyCustodyCoach Test PDF')) {
      console.log('✅ PDF extraction succeeded!');
      process.exit(0);
    } else {
      console.error('❌ PDF extraction failed: Expected text not found.');
      process.exit(2);
    }
  } catch (err) {
    console.error('❌ PDF extraction error:', err);
    process.exit(3);
  }
})(); 