import { parseInvoiceText } from '../parseInvoiceText';
import type { InvoiceData, InvoiceOcrProvider, OcrImageInput, OcrTextRecognizer } from '../types';

/**
 * Classic engine slot — always Tesseract-backed via the injected recognizer, with
 * no ambition to become anything else. Kept as a distinct, explicit choice from
 * `paddleocr`, which is the slot the future ONNX pipeline swaps into (see
 * `../models/README.md`). Until that swap lands, both providers are fed the same
 * recognizer and produce identical results — this one is guaranteed to stay that
 * way, so it remains a safe fallback even after `paddleocr` changes engines.
 */
export class TesseractOcrProvider implements InvoiceOcrProvider {
  readonly id = 'tesseract' as const;

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
