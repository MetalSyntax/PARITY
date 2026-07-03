import { AzureDocumentIntelligenceProvider } from './providers/azureDocumentIntelligenceProvider';
import { PaddleOcrInvoiceProvider } from './providers/paddleOcrProvider';
import { TesseractOcrProvider } from './providers/tesseractOcrProvider';
import type { AzureOcrConfig, InvoiceData, InvoiceOcrProvider, OcrImageInput, OcrProviderId, OcrTextRecognizer } from './types';

export interface InvoiceOcrDeps {
  /** Text recognizer backing the 'tesseract' and 'paddleocr' slots — see those providers for why this is injected. */
  paddleRecognizer: OcrTextRecognizer;
  /** Only set when the user has explicitly enabled cloud OCR in dev mode. */
  azureConfig?: AzureOcrConfig;
}

export interface InvoiceOcr {
  extract(image: OcrImageInput, providerId?: OcrProviderId): Promise<InvoiceData>;
  isProviderAvailable(providerId: OcrProviderId): boolean;
}

/** Dispatcher shared by the live-capture flow (AddTransaction) and the batch migration tool. */
export const createInvoiceOcr = (deps: InvoiceOcrDeps): InvoiceOcr => {
  const providers: Partial<Record<OcrProviderId, InvoiceOcrProvider>> = {
    tesseract: new TesseractOcrProvider(deps.paddleRecognizer),
    paddleocr: new PaddleOcrInvoiceProvider(deps.paddleRecognizer),
  };
  if (deps.azureConfig) {
    providers.azure_doc_intelligence = new AzureDocumentIntelligenceProvider(deps.azureConfig);
  }

  return {
    isProviderAvailable: (providerId: OcrProviderId) => Boolean(providers[providerId]),
    extract: async (image: OcrImageInput, providerId: OcrProviderId = 'tesseract') => {
      const provider = providers[providerId];
      if (!provider) {
        throw new Error(`OCR provider "${providerId}" is not configured. Enable it before selecting it.`);
      }
      return provider.extract(image);
    },
  };
};
