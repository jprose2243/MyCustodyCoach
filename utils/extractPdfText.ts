import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => 'str' in item ? item.str : '').join(' ');
    fullText += strings + '\n';
  }

  return fullText.trim();
}