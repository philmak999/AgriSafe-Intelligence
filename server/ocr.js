import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

async function extractFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || '').trim();
  } finally {
    await parser.destroy();
  }
}

async function extractFromImage(buffer) {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    return (data.text || '').trim();
  } finally {
    await worker.terminate();
  }
}

// Real, local, no-API-key text extraction: pdf-parse reads the text layer of
// a digitally-generated PDF, tesseract.js OCRs a photo/scan. A scanned
// (image-only) PDF isn't handled — that would need rendering pages to
// images first, out of scope for now. Never throws: OCR failure just means
// the document is stored without extracted text, not a failed upload.
export async function extractText(buffer, mimetype) {
  try {
    if (mimetype === 'application/pdf') return await extractFromPdf(buffer);
    if (IMAGE_TYPES.has(mimetype)) return await extractFromImage(buffer);
    return '';
  } catch (err) {
    console.error('OCR extraction failed:', err.message || err);
    return '';
  }
}
