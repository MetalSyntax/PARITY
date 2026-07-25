import { createInvoiceOcr, type AzureOcrConfig, type InvoiceOcr, type OcrTextRecognizer } from '@parity/core';

/**
 * TEMPORARY — wraps Tesseract.js to satisfy the `OcrTextRecognizer` contract until the
 * ONNX/PaddleOCR pipeline from .plans/parity_invoice_ocr_plan.md §4 lands (tracked in
 * packages/core/src/services/ocr/models/README.md). This is the only file that needs to
 * change once that spike confirms a real on-device engine.
 *
 * Dynamically imported (not a static top-level import) so Tesseract's ~2MB engine is only
 * fetched the first time a scan actually runs, instead of on every app load.
 */
const tesseractRecognizer: OcrTextRecognizer = {
  async recognize(image) {
    // tesseract.js is a CommonJS package (module.exports = {...}) — Vite's interop only
    // guarantees `.default`, not spread-through named exports, so unwrap defensively.
    const mod: any = await import('tesseract.js');
    const Tesseract = mod.default ?? mod;
    const { data } = await Tesseract.recognize(image, 'eng+spa');
    return {
      text: data.text,
      confidence: typeof data.confidence === 'number' ? data.confidence / 100 : undefined,
    };
  },
};

export const createWebInvoiceOcr = (azureConfig?: AzureOcrConfig): InvoiceOcr =>
  createInvoiceOcr({ paddleRecognizer: tesseractRecognizer, azureConfig });
