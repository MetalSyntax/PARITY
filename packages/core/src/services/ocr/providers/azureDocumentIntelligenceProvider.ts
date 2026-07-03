import { Currency } from '../../../types';
import type { AzureOcrConfig, InvoiceData, InvoiceLineItem, InvoiceOcrProvider, OcrImageInput } from '../types';

const API_VERSION = '2024-11-30';
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30;

interface AzureFieldValue {
  content?: string;
  confidence?: number;
  valueString?: string;
  valueDate?: string;
  valueNumber?: number;
  valueCurrency?: { amount?: number; currencySymbol?: string; currencyCode?: string };
  valueArray?: AzureFieldValue[];
  valueObject?: Record<string, AzureFieldValue>;
}

const fieldString = (field?: AzureFieldValue): string | undefined => field?.valueString ?? field?.content;
const fieldDate = (field?: AzureFieldValue): string | undefined => {
  if (!field?.valueDate) return undefined;
  const parsed = new Date(field.valueDate);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};
const fieldAmount = (field?: AzureFieldValue): number | undefined => field?.valueCurrency?.amount ?? field?.valueNumber;
const fieldCurrency = (field?: AzureFieldValue): Currency | undefined => {
  const code = field?.valueCurrency?.currencyCode?.toUpperCase();
  if (code === 'USD') return Currency.USD;
  if (code === 'VES') return Currency.VES;
  if (code === 'EUR') return Currency.EUR;
  return undefined;
};

const stripBase64Prefix = (image: OcrImageInput): string => image.replace(/^data:.*;base64,/, '');

/**
 * Opt-in, dev-mode-only cloud engine (see `.plans/parity_invoice_ocr_plan.md` §2-3).
 * Talks to Azure AI Document Intelligence's REST API directly (analyze + poll)
 * rather than pulling in `@azure/ai-form-recognizer` — the REST surface is small
 * and this avoids bundling a Node-oriented SDK into a browser PWA. Sends only the
 * receipt image bytes; never anything else from the encrypted vault.
 */
export class AzureDocumentIntelligenceProvider implements InvoiceOcrProvider {
  readonly id = 'azure_doc_intelligence' as const;

  constructor(private readonly config: AzureOcrConfig) {}

  async extract(image: OcrImageInput): Promise<InvoiceData> {
    const model = this.config.model ?? 'prebuilt-invoice';
    const base = this.config.endpoint.replace(/\/$/, '');
    const analyzeUrl = `${base}/documentintelligence/documentModels/${model}:analyze?api-version=${API_VERSION}`;

    const analyzeResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.config.apiKey,
      },
      body: JSON.stringify({ base64Source: stripBase64Prefix(image) }),
    });

    if (analyzeResponse.status !== 202) {
      const errorBody = await analyzeResponse.text().catch(() => '');
      throw new Error(`Azure Document Intelligence analyze request failed (${analyzeResponse.status}): ${errorBody}`);
    }

    const operationLocation = analyzeResponse.headers.get('operation-location');
    if (!operationLocation) {
      throw new Error('Azure Document Intelligence did not return an operation-location header.');
    }

    const result = await this.pollForResult(operationLocation);
    return this.mapToInvoiceData(result);
  }

  private async pollForResult(operationLocation: string): Promise<any> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(operationLocation, {
        headers: { 'Ocp-Apim-Subscription-Key': this.config.apiKey },
      });
      const body = await response.json();

      if (body.status === 'succeeded') return body;
      if (body.status === 'failed') {
        throw new Error(`Azure Document Intelligence analysis failed: ${JSON.stringify(body.error ?? body)}`);
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error('Azure Document Intelligence analysis timed out waiting for a result.');
  }

  private mapToInvoiceData(result: any): InvoiceData {
    const document = result.analyzeResult?.documents?.[0];
    const fields: Record<string, AzureFieldValue> = document?.fields ?? {};
    const rawText: string = result.analyzeResult?.content ?? '';

    const merchant = fieldString(fields.VendorName) ?? fieldString(fields.MerchantName);
    const invoiceDate = fieldDate(fields.InvoiceDate) ?? fieldDate(fields.TransactionDate);
    const totalField = fields.InvoiceTotal ?? fields.Total;
    const subtotalField = fields.SubTotal ?? fields.Subtotal;
    const taxField = fields.TotalTax;

    const lineItems: InvoiceLineItem[] = (fields.Items?.valueArray ?? []).map(item => {
      const obj = item.valueObject ?? {};
      return {
        description: fieldString(obj.Description) ?? '',
        quantity: fieldAmount(obj.Quantity),
        unitPrice: fieldAmount(obj.UnitPrice),
        total: fieldAmount(obj.Amount),
      };
    });

    return {
      merchant,
      invoiceDate,
      lineItems,
      subtotal: fieldAmount(subtotalField),
      tax: fieldAmount(taxField),
      total: fieldAmount(totalField),
      currency: fieldCurrency(totalField) ?? fieldCurrency(subtotalField),
      ocrProvider: this.id,
      ocrConfidence: document?.confidence,
      rawText,
      digitizedAt: new Date().toISOString(),
    };
  }
}
