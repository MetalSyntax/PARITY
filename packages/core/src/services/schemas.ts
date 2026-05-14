import { z } from 'zod';

// --- External API response schemas ---

const DolarApiEntrySchema = z.object({
  fuente: z.string(),
  promedio: z.union([z.number(), z.string()]).transform(v => Number(v)),
  fechaActualizacion: z.string().optional(),
});

export const DolarApiResponseSchema = z.array(DolarApiEntrySchema);

// --- Core entity schemas (for validating decrypted IndexedDB reads) ---

export const CurrencySchema = z.enum(['USD', 'VES', 'EUR', 'USDT']);

export const TransactionTypeSchema = z.enum(['EXPENSE', 'INCOME', 'TRANSFER']);

export const TransactionSchema = z.object({
  id: z.string(),
  type: TransactionTypeSchema,
  amount: z.number(),
  currency: CurrencySchema,
  normalizedAmountUSD: z.number().optional().default(0),
  exchangeRate: z.number().optional().default(1),
  date: z.string(),
  category: z.string().optional().default(''),
  note: z.string().optional().default(''),
  accountId: z.string(),
  profileId: z.string().optional(),
}).passthrough();

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number(),
  currency: CurrencySchema,
  profileId: z.string().optional(),
}).passthrough();

export const BudgetSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  limit: z.number(),
  month: z.string().optional(),
  profileId: z.string().optional(),
}).passthrough();

export const GoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number().optional().default(0),
  currency: CurrencySchema.optional().default('USD'),
  profileId: z.string().optional(),
}).passthrough();

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarColor: z.string().optional().default('#6366f1'),
  defaultCurrency: CurrencySchema.optional().default('USD'),
  paymentHandles: z.array(z.object({
    type: z.string(),
    value: z.string(),
    label: z.string().optional(),
  })).optional().default([]),
  notes: z.string().optional(),
  createdAt: z.string(),
  profileId: z.string().optional(),
}).passthrough();

export const DebtSchema = z.object({
  id: z.string(),
  type: z.enum(['i_owe', 'they_owe']),
  counterpartyName: z.string(),
  amount: z.number(),
  currency: CurrencySchema,
  amountAtRateUSD: z.number(),
  description: z.string().optional().default(''),
  status: z.enum(['active', 'partial', 'settled']),
  payments: z.array(z.object({
    amount: z.number(),
    date: z.string(),
    note: z.string().optional(),
  })).optional().default([]),
  createdAt: z.string(),
  profileId: z.string().optional(),
}).passthrough();

// --- Parsed CSV row schema for import validation ---

export const CsvTransactionRowSchema = z.object({
  date: z.string(),
  type: z.string(),
  amount: z.string().or(z.number()).transform(v => Number(v)),
  currency: z.string().optional().default('USD'),
  category: z.string().optional().default(''),
  note: z.string().optional().default(''),
  account: z.string().optional().default(''),
});

// Type exports
export type DolarApiEntry = z.infer<typeof DolarApiEntrySchema>;
export type ValidatedTransaction = z.infer<typeof TransactionSchema>;
export type ValidatedAccount = z.infer<typeof AccountSchema>;
