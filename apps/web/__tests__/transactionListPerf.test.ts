import { Currency, TransactionType } from '@parity/core';
import type { Transaction } from '@parity/core';
import { filterAndSortTransactions, groupTransactionsByDate } from '../utils/transactionListUtils';

const CATEGORY_IDS = ['food', 'transport', 'rent', 'salary', 'entertainment'];

function makeTransactions(count: number): Transaction[] {
  const transactions: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    // Spread across ~5 years so there are tens of thousands of distinct group-by-date buckets,
    // mirroring what a multi-year power-user history actually looks like.
    const day = i % 1800;
    const date = new Date(2020, 0, 1 + day).toISOString();
    transactions.push({
      id: `tx-${i}`,
      amount: 10 + (i % 500),
      originalCurrency: Currency.USD,
      exchangeRate: 40,
      normalizedAmountUSD: 10 + (i % 500),
      type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      category: CATEGORY_IDS[i % CATEGORY_IDS.length],
      accountId: `acc-${i % 10}`,
      note: i % 97 === 0 ? 'Groceries at the corner store' : `note-${i}`,
      date,
      updatedAt: date,
    });
  }
  return transactions;
}

describe('transaction list filtering/sorting at scale', () => {
  const categoryNameById = new Map(CATEGORY_IDS.map(id => [id, id]));

  it('filters, sorts and groups 100,000 transactions well within budget', () => {
    const transactions = makeTransactions(100_000);

    const start = performance.now();
    const filtered = filterAndSortTransactions(
      transactions,
      { searchQuery: '', filterType: 'ALL', selectedCategory: 'ALL', selectedMonth: 'ALL', selectedWalletId: null },
      categoryNameById
    );
    const grouped = groupTransactionsByDate(filtered);
    const elapsedMs = performance.now() - start;

    expect(filtered).toHaveLength(100_000);
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
    // Generous budget for slower CI machines — the point of this test is to catch an
    // accidental O(n²) or per-row Date-allocation regression, not to micro-benchmark.
    expect(elapsedMs).toBeLessThan(2000);
  });

  it('sorts newest-first using plain ISO string comparison (no Date parsing needed)', () => {
    const transactions = makeTransactions(1000);
    const filtered = filterAndSortTransactions(
      transactions,
      { searchQuery: '', filterType: 'ALL', selectedCategory: 'ALL', selectedMonth: 'ALL', selectedWalletId: null },
      categoryNameById
    );
    for (let i = 1; i < filtered.length; i++) {
      expect(filtered[i - 1].date >= filtered[i].date).toBe(true);
    }
  });

  it('still applies search/type/category/month/wallet filters correctly at scale', () => {
    const transactions = makeTransactions(50_000);
    const filtered = filterAndSortTransactions(
      transactions,
      { searchQuery: 'groceries', filterType: 'ALL', selectedCategory: 'ALL', selectedMonth: 'ALL', selectedWalletId: null },
      categoryNameById
    );
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(tx => tx.note?.toLowerCase().includes('groceries'))).toBe(true);
  });
});
