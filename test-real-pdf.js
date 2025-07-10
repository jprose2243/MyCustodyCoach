const fs = require('fs');
const PDFDocument = require('pdfkit');

// Create a real PDF for testing
function createTestPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    
    doc.fontSize(16).text('MyCustodyCoach Test PDF', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('This is a test PDF document for testing PDF extraction functionality.');
    doc.moveDown();
    doc.text('Key points:');
    doc.moveDown();
    doc.text('• PDF extraction should work with pdfjs-dist');
    doc.text('• Text should be extracted properly');
    doc.text('• Multiple lines should be handled');
    doc.moveDown();
    doc.text('This document is being used to test our PDF extraction implementation after the migration.');
    
    doc.end();
  });
}

async function testRealPDFExtraction() {
  console.log('🧪 Testing Real PDF Extraction with pdfjs-dist...\n');
  
  try {
    // Create a real PDF
    console.log('📄 Creating test PDF...');
    const pdfBuffer = await createTestPDF();
    console.log(`✅ PDF created: ${pdfBuffer.length} bytes`);
    
    // Test PDF header validation
    const header = pdfBuffer.slice(0, 4).toString('ascii');
    console.log(`📄 PDF header: ${header}`);
    
    if (header === '%PDF') {
      console.log('✅ PDF header validation passed');
    } else {
      console.log('❌ PDF header validation failed');
      return;
    }
    
    // Test PDF extraction (we'll simulate this since we can't import the TypeScript function directly)
    console.log('📄 Testing PDF extraction logic...');
    
    // Import pdfjs-dist legacy build for Node.js
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = false;
    
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdf = await loadingTask.promise;
    
    console.log(`📄 PDF loaded: ${pdf.numPages} pages`);
    
    let extractedText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n';
    }
    
    console.log('✅ PDF text extraction successful!');
    console.log('📄 Extracted text preview:', extractedText.substring(0, 100) + '...');
    console.log(`📄 Total extracted text length: ${extractedText.length} characters`);
    
    // Save the PDF for manual testing
    fs.writeFileSync('test-pdf.pdf', pdfBuffer);
    console.log('💾 Test PDF saved as test-pdf.pdf');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRealPDFExtraction(); 