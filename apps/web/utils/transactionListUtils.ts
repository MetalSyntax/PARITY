import { Transaction, TransactionType } from '@parity/core';

export interface TransactionListFilters {
  searchQuery: string;
  filterType: TransactionType | 'ALL';
  selectedCategory: string;
  selectedMonth: string;
  selectedWalletId: string | null;
}

/**
 * Filters and sorts transactions for TransactionsListView. Extracted out of the component so
 * it can be exercised directly in perf tests — this is the hot path that has to stay fast at
 * tens of thousands of rows, and `categoryNameById` (a precomputed id -> translated-lowercase-name
 * map) avoids doing a CATEGORIES.find() + translation lookup per transaction.
 */
export function filterAndSortTransactions(
  transactions: Transaction[],
  filters: TransactionListFilters,
  categoryNameById: Map<string, string>
): Transaction[] {
  const query = filters.searchQuery.trim().toLowerCase();
  return transactions.filter((tx) => {
    const matchesSearch = !query
      || (tx.note || '').toLowerCase().includes(query)
      || (categoryNameById.get(tx.category) || '').includes(query);
    const matchesType = filters.filterType === 'ALL' || tx.type === filters.filterType;
    const matchesCategory = filters.selectedCategory === 'ALL' || tx.category === filters.selectedCategory;
    const matchesMonth = filters.selectedMonth === 'ALL' || tx.date.startsWith(filters.selectedMonth);
    const matchesWallet = !filters.selectedWalletId || tx.accountId === filters.selectedWalletId || tx.toAccountId === filters.selectedWalletId;
    return matchesSearch && matchesType && matchesCategory && matchesMonth && matchesWallet;
  // tx.date is always an ISO string, so plain string comparison gives the same chronological
  // order as parsing each side into a Date, without allocating a Date object per comparison.
  }).sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

/** Groups already-filtered transactions by their calendar date (YYYY-MM-DD). */
export function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  transactions.forEach((tx) => {
    const date = tx.date.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  });
  return groups;
}
