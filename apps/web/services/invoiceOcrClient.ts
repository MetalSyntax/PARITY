import { createInvoiceOcr, type AzureOcrConfig, type InvoiceOcr, type OcrTextRecognizer } from '@parity/core';

declare global {
  interface Window {
    Tesseract: any;
  }
}

/**
 * TEMPORARY — wraps the Tesseract.js CDN script (see index.html) to satisfy the
 * `OcrTextRecognizer` contract until the ONNX/PaddleOCR pipeline from
 * .plans/parity_invoice_ocr_plan.md §4 lands (tracked in
 * packages/core/src/services/ocr/models/README.md). This is the only file that
 * needs to change once that spike confirms a real on-device engine.
 */
const tesseractRecognizer: OcrTextRecognizer = {
  async recognize(image) {
    if (!window.Tesseract) {
      throw new Error('OCR engine (Tesseract.js) has not finished loading yet.');
    }
    const { data } = await window.Tesseract.recognize(image, 'eng+spa');
    return {
      text: data.text,
      confidence: typeof data.confidence === 'number' ? data.confidence / 100 : undefined,
    };
  },
};

export const createWebInvoiceOcr = (azureConfig?: AzureOcrConfig): InvoiceOcr =>
  createInvoiceOcr({ paddleRecognizer: tesseractRecognizer, azureConfig });
