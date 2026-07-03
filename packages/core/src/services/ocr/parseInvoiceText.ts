import { Currency } from '../../types';
import type { InvoiceLineItem } from './types';

const TOTAL_KEYWORDS = ['total', 'neto', 'suma', 'amount', 'grand total', 'valor total', 'importe total', 'pago total', 'pagar', 'total a pagar'];
const SUBTOTAL_KEYWORDS = ['subtotal', 'sub total', 'sub-total', 'base imponible'];
const TAX_KEYWORDS = ['iva', 'tax', 'impuesto', 'i.v.a'];
const DATE_REGEX = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/;
const AMOUNT_REGEX = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))|(\d+[.,]\d{1,2})|(\d+)/g;

const normalizeNumber = (raw: string): number => {
  let cleaned = raw.replace(/\s/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    cleaned = lastDot > lastComma ? cleaned.replace(/,/g, '') : cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
};

const lastAmountInLine = (line: string, nextLine?: string): number | undefined => {
  const matches = line.match(AMOUNT_REGEX);
  if (matches && matches.length > 0) return normalizeNumber(matches[matches.length - 1]);
  if (nextLine) {
    const nextMatches = nextLine.match(AMOUNT_REGEX);
    if (nextMatches && nextMatches.length > 0) return normalizeNumber(nextMatches[nextMatches.length - 1]);
  }
  return undefined;
};

const detectCurrency = (text: string): Currency | undefined => {
  const lower = text.toLowerCase();
  if (lower.includes('bs') || lower.includes('ves') || lower.includes('bolivares') || lower.includes('bolívares')) return Currency.VES;
  if (lower.includes('$') || lower.includes('usd') || lower.includes('dolar') || lower.includes('dólar')) return Currency.USD;
  return undefined;
};

/**
 * `excludeKeywords` matters because 'total' is a substring of 'subtotal' — without
 * excluding subtotal/tax lines, a "Subtotal: 655.00" line would win the TOTAL_KEYWORDS
 * search before the real "Total: 759.80" line further down ever gets checked.
 */
const findByKeywords = (lines: string[], keywords: string[], excludeKeywords: string[] = []): number | undefined => {
  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase();
    if (excludeKeywords.some(kw => lowerLine.includes(kw))) continue;
    if (keywords.some(kw => lowerLine.includes(kw))) {
      const amount = lastAmountInLine(lines[i], lines[i + 1]);
      if (amount !== undefined) return amount;
    }
  }
  return undefined;
};

const QTY_PRICE_REGEX = /^(\d+(?:[.,]\d+)?)\s*[xX×]\s*([\d.,]+)/;
const ALL_KEYWORDS = [...TOTAL_KEYWORDS, ...SUBTOTAL_KEYWORDS, ...TAX_KEYWORDS];
// Header/footer metadata that sits between the merchant line and the item table on
// most LatAm receipts — never a purchasable line item even when it trails a number.
const METADATA_KEYWORDS = ['rif', 'nit', 'ruc', 'tel', 'telefono', 'teléfono', 'direccion', 'dirección', 'address', 'phone', 'fecha', 'hora', 'factura', 'invoice no', 'nro', 'no.'];

const findTotalsSectionStart = (lines: string[]): number => {
  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase();
    if (ALL_KEYWORDS.some(kw => lowerLine.includes(kw))) return i;
  }
  return lines.length;
};

/**
 * Everything between the merchant/header line and the first totals-block keyword
 * is treated as the line-item table. Each candidate line needs a trailing amount
 * to count as an item — bare description lines without a price are dropped rather
 * than guessed at, since the flat-text pass has no layout info to fall back on.
 */
const findLineItems = (lines: string[], merchantLine?: string): InvoiceLineItem[] => {
  const merchantIndex = merchantLine ? lines.indexOf(merchantLine) : -1;
  const start = merchantIndex >= 0 ? merchantIndex + 1 : 0;
  const end = findTotalsSectionStart(lines);

  const items: InvoiceLineItem[] = [];
  for (let i = start; i < end; i++) {
    const line = lines[i];
    if (line.length < 3) continue;
    if (DATE_REGEX.test(line)) continue;
    const lowerLine = line.toLowerCase();
    if (METADATA_KEYWORDS.some(kw => lowerLine.includes(kw))) continue;

    const qtyMatch = line.match(QTY_PRICE_REGEX);
    const quantity = qtyMatch ? normalizeNumber(qtyMatch[1]) : undefined;
    const unitPrice = qtyMatch ? normalizeNumber(qtyMatch[2]) : undefined;

    const amountMatches = line.match(AMOUNT_REGEX);
    if (!amountMatches || amountMatches.length === 0) continue;
    const total = normalizeNumber(amountMatches[amountMatches.length - 1]);

    let description = line;
    if (qtyMatch) description = description.replace(qtyMatch[0], '');
    description = description.replace(new RegExp(`${amountMatches[amountMatches.length - 1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '');
    description = description.replace(/[-:\s]+$/, '').trim();
    if (!description) continue;

    items.push({ description, quantity, unitPrice, total });
  }
  return items;
};

const findMerchant = (lines: string[]): string | undefined => {
  // AMOUNT_REGEX carries the `g` flag (stateful lastIndex) — use match() instead of
  // test() here so repeated calls in this loop don't silently skip every other line.
  const candidate = lines.find(l => l.trim().length >= 3 && !l.match(AMOUNT_REGEX) && !DATE_REGEX.test(l));
  return candidate?.trim();
};

const findDate = (text: string): string | undefined => {
  const match = text.match(DATE_REGEX);
  if (!match) return undefined;
  const parts = match[1].split(/[\/\-.]/).map(p => p.trim());
  if (parts.length !== 3) return undefined;
  let [d, m, y] = parts;
  if (y.length === 2) y = `20${y}`;
  const iso = new Date(Number(y), Number(m) - 1, Number(d));
  return isNaN(iso.getTime()) ? undefined : iso.toISOString();
};

/**
 * Flat-text heuristic parser shared by every OCR provider. Providers that return
 * layout/box positions (the eventual PaddleOCR pipeline) can additionally use box
 * coordinates to group a header/line-item table/totals block more precisely — this
 * function is the text-only fallback all of them run through today.
 */
export const parseInvoiceText = (rawText: string): {
  merchant?: string;
  invoiceDate?: string;
  lineItems: InvoiceLineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: Currency;
} => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const currency = detectCurrency(rawText);
  const merchant = findMerchant(lines);
  const invoiceDate = findDate(rawText);
  const subtotal = findByKeywords(lines, SUBTOTAL_KEYWORDS);
  const tax = findByKeywords(lines, TAX_KEYWORDS);
  let total = findByKeywords(lines, TOTAL_KEYWORDS, [...SUBTOTAL_KEYWORDS, ...TAX_KEYWORDS]);
  const lineItems = findLineItems(lines, merchant);

  if (total === undefined) {
    const allMatches = rawText.match(AMOUNT_REGEX);
    if (allMatches && allMatches.length > 0) {
      total = Math.max(...allMatches.map(normalizeNumber));
    }
  }

  return { merchant, invoiceDate, lineItems, subtotal, tax, total, currency };
};
