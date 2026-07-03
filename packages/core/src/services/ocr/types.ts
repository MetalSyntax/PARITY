import type { Currency } from '../../types';

/**
 * `packages/core` has no DOM lib (see tsconfig.base.json), so images are passed
 * as base64/data-URL strings rather than HTMLCanvasElement — callers (web, mobile)
 * are responsible for converting a canvas/camera frame to a string before calling
 * into this service.
 */
export type OcrImageInput = string;

export type OcrProviderId = 'tesseract' | 'paddleocr' | 'azure_doc_intelligence';

export interface InvoiceLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export interface InvoiceData {
  merchant?: string;
  invoiceDate?: string; // ISO date, parsed from the document
  lineItems: InvoiceLineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: Currency;
  ocrProvider: OcrProviderId;
  ocrConfidence?: number; // 0-1, provider-reported
  rawText: string; // full OCR text, kept for re-parsing/debugging
  digitizedAt: string; // ISO timestamp, used to skip already-processed receipts
}

export interface InvoiceOcrProvider {
  id: OcrProviderId;
  extract(image: OcrImageInput): Promise<InvoiceData>;
}

/**
 * `TesseractOcrProvider` and `PaddleOcrInvoiceProvider` do not themselves know how
 * to run text recognition —
 * `packages/core` can't assume a DOM/window (it's shared with React Native), and
 * the real on-device engine (PaddleOCR weights converted to ONNX, run via
 * onnxruntime-web) is still pending the Phase 0 feasibility spike (see
 * `.plans/parity_invoice_ocr_plan.md` §4). Callers inject whatever text
 * recognizer they currently have available; today that's a Tesseract.js
 * wrapper — see `models/README.md` for the swap-out contract.
 */
export interface OcrTextRecognizer {
  recognize(image: OcrImageInput): Promise<{ text: string; confidence?: number }>;
}

export interface AzureOcrConfig {
  endpoint: string;
  apiKey: string;
  /** `prebuilt-invoice` handles PO/due-date/tax-breakdown documents; `prebuilt-receipt` suits simple retail tickets. */
  model?: 'prebuilt-invoice' | 'prebuilt-receipt';
}
