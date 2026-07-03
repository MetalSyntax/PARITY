import { parseInvoiceText } from '../parseInvoiceText';
import type { InvoiceData, InvoiceOcrProvider, OcrImageInput, OcrTextRecognizer } from '../types';

/**
 * STUB — pending Phase 0 of `.plans/parity_invoice_ocr_plan.md` §4.
 *
 * The plan's real design for this provider is: canvas preprocessing (deskew,
 * contrast, crop-to-content) → PaddleOCR detection+recognition (converted to
 * ONNX, run via onnxruntime-web) → layout-aware parsing of the returned text
 * boxes by position, instead of a flat-text regex scan.
 *
 * None of that on-device ONNX pipeline exists yet — it requires the spike in
 * §4 (real receipt photos, a physical phone for inference timing) which isn't
 * something that can be done without those in hand. Until that spike lands,
 * this provider satisfies the `InvoiceOcrProvider` contract by delegating text
 * recognition to whatever `OcrTextRecognizer` the caller injects (currently a
 * Tesseract.js wrapper — see `apps/web` and `apps/mobile-experimental`) and
 * running it through the same shared `parseInvoiceText` heuristic every
 * provider uses. `id` stays `'paddleocr'` because this is the *default local
 * provider* slot — swapping the injected recognizer for a real PaddleOCR/ONNX
 * one is the only change needed once the spike confirms a path.
 */
export class PaddleOcrInvoiceProvider implements InvoiceOcrProvider {
  readonly id = 'paddleocr' as const;

  constructor(private readonly recognizer: OcrTextRecognizer) {}

  async extract(image: OcrImageInput): Promise<InvoiceData> {
    const { text, confidence } = await this.recognizer.recognize(image);
    const parsed = parseInvoiceText(text);

    return {
      ...parsed,
      ocrProvider: this.id,
      ocrConfidence: confidence,
      rawText: text,
      digitizedAt: new Date().toISOString(),
    };
  }
}
