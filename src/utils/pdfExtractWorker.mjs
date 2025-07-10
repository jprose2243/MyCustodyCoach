import fs from 'fs';
import { argv, stdin, stdout, exit } from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

// Dynamically search for the worker file
function findWorkerFile() {
  const searchDirs = [
    path.resolve(__dirname, '../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    path.resolve(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    path.resolve(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
    path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
  ];
  for (const candidate of searchDirs) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('pdf.worker.mjs not found in any expected location');
}

async function extractTextFromPDF(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = findWorkerFile();
  console.log('Using PDF worker at:', workerPath);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let extractedText = '';
  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(i => i.str).join(' ');
    extractedText += pageText + '\n';
  }
  return extractedText;
}

async function main() {
  try {
    let buffer;
    if (argv[2]) {
      buffer = fs.readFileSync(argv[2]);
    } else {
      buffer = await new Promise((resolve, reject) => {
        const chunks = [];
        stdin.on('data', chunk => chunks.push(chunk));
        stdin.on('end', () => resolve(Buffer.concat(chunks)));
        stdin.on('error', reject);
      });
    }
    const text = await extractTextFromPDF(buffer);
    stdout.write(JSON.stringify({ text }));
  } catch (err) {
    stdout.write(JSON.stringify({ error: err.message }));
    exit(1);
  }
}
main(); 