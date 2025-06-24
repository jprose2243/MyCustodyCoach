import fs from 'fs';
import assert from 'assert';
import { parseFileContent } from '../lib/parsers';

(async () => {
  const buffer = fs.readFileSync('app/public/test-docs/Parenting-Plan.pdf');
  const text = await parseFileContent(buffer, 'application/pdf');
  assert.ok(text && text.length > 0, 'Should extract some text from PDF');
  assert.ok(/COURT/i.test(text), 'Extracted text should contain known phrase');
  console.log('PDF parsing test passed');
})();

