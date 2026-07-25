import { buildMinimalSyncPayload, Currency, TransactionType } from '@parity/core';
import type { Transaction, UserProfile } from '@parity/core';

// Stand-in for a real receipt photo: cameras/phone galleries routinely produce
// multi-megabyte base64 strings once a JPEG is data-URI encoded.
const FAKE_RECEIPT_BYTES = 2 * 1024 * 1024; // 2MB, well within what a single photo costs
const fakeReceipt = () => `data:image/jpeg;base64,${'A'.repeat(FAKE_RECEIPT_BYTES)}`;

const baseUserProfile: UserProfile = {
  id: 'profile-1',
  name: 'Test User',
  language: 'es' as any,
};

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: `tx-${Math.random()}`,
  amount: 100,
  originalCurrency: Currency.USD,
  exchangeRate: 40,
  normalizedAmountUSD: 100,
  type: TransactionType.EXPENSE,
  category: 'food',
  accountId: 'acc-1',
  note: 'Groceries',
  date: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

describe('buildMinimalSyncPayload', () => {
  it('never includes the receipt image, even when transactions have one', () => {
    const payload = buildMinimalSyncPayload({
      since: null,
      syncedAt: '2026-07-24T00:00:00.000Z',
      transactions: [makeTransaction({ receipt: fakeReceipt() })],
      accounts: [],
      scheduledPayments: [],
      budgets: [],
      goals: [],
      shoppingLists: [],
      userProfile: baseUserProfile,
    });

    expect(payload.transactions).toHaveLength(1);
    expect(payload.transactions[0]).not.toHaveProperty('receipt');
  });

  it('keeps every other transaction field, including structured invoiceData', () => {
    const invoiceData = { lineItems: [], ocrProvider: 'tesseract' as const, rawText: 'total: 12.00', digitizedAt: '2026-07-01T00:00:00.000Z' };
    const tx = makeTransaction({ receipt: fakeReceipt(), invoiceData });
    const payload = buildMinimalSyncPayload({
      since: null,
      syncedAt: '2026-07-24T00:00:00.000Z',
      transactions: [tx],
      accounts: [],
      scheduledPayments: [],
      budgets: [],
      goals: [],
      shoppingLists: [],
      userProfile: baseUserProfile,
    });

    const { receipt, ...rest } = tx;
    expect(payload.transactions[0]).toEqual(rest);
  });

  it('only includes transactions updated after `since`, but strips receipts regardless', () => {
    const stale = makeTransaction({ id: 'stale', updatedAt: '2026-07-01T00:00:00.000Z', receipt: fakeReceipt() });
    const fresh = makeTransaction({ id: 'fresh', updatedAt: '2026-07-20T00:00:00.000Z', receipt: fakeReceipt() });
    const payload = buildMinimalSyncPayload({
      since: '2026-07-10T00:00:00.000Z',
      syncedAt: '2026-07-24T00:00:00.000Z',
      transactions: [stale, fresh],
      accounts: [],
      scheduledPayments: [],
      budgets: [],
      goals: [],
      shoppingLists: [],
      userProfile: baseUserProfile,
    });

    expect(payload.transactions.map(t => t.id)).toEqual(['fresh']);
  });

  // Regression guard: this is the exact bug that was reported — a handful of receipt
  // photos turning a "minimal" sync into an 11MB upload. If `receipt` (or some other
  // large field) ever leaks back into this payload, this test fails loudly instead of
  // someone finding out from a multi-megabyte Drive upload again.
  it('stays kilobyte-sized even with many large receipts attached', () => {
    const transactions = Array.from({ length: 50 }, (_, i) =>
      makeTransaction({ id: `tx-${i}`, receipt: fakeReceipt() })
    );
    const payload = buildMinimalSyncPayload({
      since: null,
      syncedAt: '2026-07-24T00:00:00.000Z',
      transactions,
      accounts: [],
      scheduledPayments: [],
      budgets: [],
      goals: [],
      shoppingLists: [],
      userProfile: baseUserProfile,
    });

    const sizeInKB = Buffer.byteLength(JSON.stringify(payload), 'utf8') / 1024;
    expect(sizeInKB).toBeLessThan(100);
  });
});
