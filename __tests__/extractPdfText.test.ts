import fs from 'fs';
import path from 'path';
import { extractPdfText } from '../app/utils/extractPdfText';

describe('extractPdfText', () => {
  it('returns non-empty text for sample PDF', async () => {
    const filePath = path.resolve(process.cwd(), 'public/test-docs/Parenting-Plan.pdf');
    const buffer = fs.readFileSync(filePath);
    const text = await extractPdfText(buffer);
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
