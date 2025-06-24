import fs from 'fs';
import path from 'path';
import { extractPdfText } from './extractPdfText';

(async () => {
  try {
    const filePath = path.resolve(process.cwd(), 'public/test-docs/Parenting-Plan.pdf');

    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ PDF file not found at: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const text = await extractPdfText(buffer);

    console.log('\n✅ Extracted PDF Text Preview:\n');
    console.log(text.slice(0, 1000)); // Preview first 1000 characters
    console.log('\n✅ Extraction complete!');
  } catch (err) {
    console.error('\n❌ Failed to extract PDF text:', err);
  }
})();