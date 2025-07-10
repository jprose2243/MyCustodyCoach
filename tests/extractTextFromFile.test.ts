import { extractTextFromFile } from '../src/utils/extractTextFromFile';
import fs from 'fs';
import path from 'path';

describe('extractTextFromFile', () => {
  it('should extract text from TXT files', async () => {
    const testContent = `This is a test document for MyCustodyCoach.
    
It contains multiple lines of text that should be extracted properly.
This document is being used to test our file extraction functionality.

Key points:
- PDF extraction should work with pdfjs-dist
- DOCX extraction should work with mammoth
- TXT extraction should work with basic buffer reading
- Error handling should be robust

This test is part of our migration debugging process.`;
    
    const txtBuffer = Buffer.from(testContent, 'utf-8');
    const result = await extractTextFromFile(txtBuffer, 'text/plain');
    
    expect(result).toContain('MyCustodyCoach');
    expect(result).toContain('test document');
    expect(result).toContain('PDF extraction should work');
  });

  it('should handle empty TXT files', async () => {
    const emptyBuffer = Buffer.from('', 'utf-8');
    const result = await extractTextFromFile(emptyBuffer, 'text/plain');
    
    expect(result).toBe('');
  });

  it('should truncate long text files', async () => {
    // Create a very long text content
    const longContent = 'A'.repeat(15000);
    const buffer = Buffer.from(longContent, 'utf-8');
    const result = await extractTextFromFile(buffer, 'text/plain');
    
    expect(result).toContain('...[truncated]');
    expect(result.length).toBeLessThan(15000);
  });

  it('should handle invalid PDF headers', async () => {
    const invalidPdfBuffer = Buffer.from('This is not a PDF file');
    const result = await extractTextFromFile(invalidPdfBuffer, 'application/pdf');
    
    expect(result).toContain('Invalid PDF file');
  });

  it('should handle unsupported file types', async () => {
    const buffer = Buffer.from('test content');
    
    const result = await extractTextFromFile(buffer, 'application/invalid');
    expect(result).toContain('File processing failed');
  });

  it('should handle image files gracefully', async () => {
    const imageBuffer = Buffer.from('fake image data');
    const result = await extractTextFromFile(imageBuffer, 'image/jpeg');
    
    expect(result).toContain('Image text extraction is currently being improved');
  });

  it('should handle DOCX files gracefully', async () => {
    // Mock DOCX content (this would normally be a real DOCX file)
    const docxBuffer = Buffer.from('fake docx content');
    
    // This test will likely fail since we're not providing real DOCX content
    // but it should handle the error gracefully
    const result = await extractTextFromFile(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    expect(result).toContain('DOCX processing failed');
  });

  it('should extract text from a real PDF file', async () => {
    // Load a real PDF file from the test assets directory
    const pdfPath = path.join(__dirname, 'assets', 'sample.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.warn('⚠️  Skipping real PDF extraction test: sample.pdf not found.');
      return;
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    const result = await extractTextFromFile(pdfBuffer, 'application/pdf');
    // The sample PDF should contain the phrase 'MyCustodyCoach Test PDF'
    expect(result).toContain('MyCustodyCoach Test PDF');
  });
}); 