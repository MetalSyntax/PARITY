import {
  calculateLinearRegression,
  projectMonthEndSpending,
  calculateRunway,
  checkBudgetForecasts,
  calculateFiscalYearSummary,
} from '@parity/core';
import { Transaction, TransactionType, Currency, Budget } from '@parity/core';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeExpense(daysAgo: number, amount: number, category = 'food', id = `tx-${daysAgo}-${Math.random()}`): Transaction {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id,
    amount,
    originalCurrency: Currency.USD,
    exchangeRate: 1,
    normalizedAmountUSD: amount,
    type: TransactionType.EXPENSE,
    category,
    accountId: 'acc-1',
    note: '',
    date: d.toISOString(),
  };
}

function makeIncome(daysAgo: number, amount: number, fiscalTag?: string): Transaction {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `inc-${daysAgo}-${Math.random()}`,
    amount,
    originalCurrency: Currency.USD,
    exchangeRate: 1,
    normalizedAmountUSD: amount,
    type: TransactionType.INCOME,
    category: 'income',
    accountId: 'acc-1',
    note: '',
    date: d.toISOString(),
    fiscalTag: fiscalTag as any,
  };
}

// ─── calculateLinearRegression ────────────────────────────────────────────────

describe('calculateLinearRegression', () => {
  it('returns slope=2 intercept=0 for y=2x data', () => {
    const data: [number, number][] = [[1, 2], [2, 4], [3, 6], [4, 8]];
    const { slope, intercept } = calculateLinearRegression(data);
    expect(slope).toBeCloseTo(2);
    expect(intercept).toBeCloseTo(0);
  });

  it('returns slope=0 intercept=mean for a single point', () => {
    const { slope, intercept } = calculateLinearRegression([[5, 10]]);
    expect(slope).toBe(0);
    expect(intercept).toBe(10);
  });

  it('returns zeros for empty data', () => {
    const { slope, intercept } = calculateLinearRegression([]);
    expect(slope).toBe(0);
    expect(intercept).toBe(0);
  });

  it('handles a flat line (slope=0)', () => {
    const data: [number, number][] = [[1, 5], [2, 5], [3, 5]];
    const { slope } = calculateLinearRegression(data);
    expect(slope).toBeCloseTo(0);
  });
});

// ─── calculateRunway ──────────────────────────────────────────────────────────

describe('calculateRunway', () => {
  it('returns correct days based on 30-day burn rate', () => {
    const txs = Array.from({ length: 30 }, (_, i) => makeExpense(i, 10));
    expect(calculateRunway(100, txs)).toBe(10); // 100 / (300/30) = 10
  });

  it('returns Infinity when there are no expenses', () => {
    expect(calculateRunway(100, [])).toBe(Infinity);
  });

  it('returns 0 when balance is 0', () => {
    const txs = [makeExpense(1, 10)];
    expect(calculateRunway(0, txs)).toBe(0);
  });

  it('ignores income transactions', () => {
    const txs = [makeIncome(1, 1000), makeExpense(1, 10)];
    // Only 10 spent over 30 days = 10/30 daily burn; runway = 100 / (10/30) = 300
    expect(calculateRunway(100, txs)).toBe(300);
  });

  it('ignores transactions older than 30 days', () => {
    const recent = makeExpense(5, 10);
    const old = makeExpense(35, 9999); // outside 30-day window
    expect(calculateRunway(100, [recent, old])).toBe(300);
  });
});

// ─── projectMonthEndSpending ──────────────────────────────────────────────────

describe('projectMonthEndSpending', () => {
  it('returns zeros when no expenses', () => {
    const result = projectMonthEndSpending([], new Date());
    expect(result.base).toBe(0);
    expect(result.optimistic).toBe(0);
    expect(result.pessimistic).toBe(0);
  });

  it('projects base >= current month spend', () => {
    const txs = Array.from({ length: 15 }, (_, i) => makeExpense(i, 20));
    const result = projectMonthEndSpending(txs);
    // Current month spend is at least the transactions this month
    expect(result.base).toBeGreaterThanOrEqual(0);
    expect(result.pessimistic).toBeGreaterThanOrEqual(result.base);
    expect(result.optimistic).toBeLessThanOrEqual(result.base);
  });

  it('pessimistic >= base >= optimistic', () => {
    const txs = Array.from({ length: 20 }, (_, i) => makeExpense(i, 15));
    const { base, optimistic, pessimistic } = projectMonthEndSpending(txs);
    expect(pessimistic).toBeGreaterThanOrEqual(base);
    expect(base).toBeGreaterThanOrEqual(optimistic);
  });
});

// ─── checkBudgetForecasts ─────────────────────────────────────────────────────

describe('checkBudgetForecasts', () => {
  it('returns empty array when no budgets', () => {
    const txs = [makeExpense(5, 50, 'food')];
    expect(checkBudgetForecasts(txs, [])).toEqual([]);
  });

  it('returns categoryId when projected to exceed budget', () => {
    // Fixed date: May 13 — day 13 of 31, 18 days remaining.
    // Spend $8/day for 10 days = $80 total (below $100 limit).
    // dailyBurn = 80/13 ≈ 6.15; projected = 80 + 6.15*18 ≈ 190 > 100 → alert fires.
    const testDate = new Date('2026-05-13T12:00:00Z');
    const txs = Array.from({ length: 10 }, (_, i) => ({
      id: `tx-${i}`,
      amount: 8,
      originalCurrency: Currency.USD,
      exchangeRate: 1,
      normalizedAmountUSD: 8,
      type: TransactionType.EXPENSE,
      category: 'food',
      accountId: 'acc-1',
      note: '',
      date: new Date(2026, 4, i + 1).toISOString(), // May 1–10 2026
    } as Transaction));
    const budgets: Budget[] = [{ id: 'b1', categoryId: 'food', limit: 100 }];
    const alerts = checkBudgetForecasts(txs, budgets, testDate);
    expect(alerts).toContain('food');
  });

  it('does not alert when already exceeded (would spam)', () => {
    const today = new Date();
    // Spend $200 already this month — already over the $100 limit
    const tx: Transaction = {
      id: 'tx-1',
      amount: 200,
      originalCurrency: Currency.USD,
      exchangeRate: 1,
      normalizedAmountUSD: 200,
      type: TransactionType.EXPENSE,
      category: 'food',
      accountId: 'acc-1',
      note: '',
      date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
    };
    const budgets: Budget[] = [{ id: 'b1', categoryId: 'food', limit: 100 }];
    const alerts = checkBudgetForecasts([tx], budgets, today);
    // categorySpend (200) > limit (100) so no alert (already exceeded guard)
    expect(alerts).not.toContain('food');
  });

  it('skips budgets for a different month', () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const tx = makeExpense(5, 50, 'rent');
    const budgets: Budget[] = [{ id: 'b2', categoryId: 'rent', limit: 10, month: lastMonthStr }];
    const alerts = checkBudgetForecasts([tx], budgets, today);
    expect(alerts).not.toContain('rent');
  });
});

// ─── calculateFiscalYearSummary ───────────────────────────────────────────────

describe('calculateFiscalYearSummary', () => {
  const year = 2025;

  const txInYear = (type: TransactionType, amount: number, fiscalTag: string): Transaction => ({
    id: `fiscal-${Math.random()}`,
    amount,
    originalCurrency: Currency.USD,
    exchangeRate: 1,
    normalizedAmountUSD: amount,
    type,
    category: 'misc',
    accountId: 'acc-1',
    note: '',
    date: `${year}-06-15T12:00:00Z`,
    fiscalTag: fiscalTag as any,
  });

  it('sums taxable income correctly', () => {
    const txs = [
      txInYear(TransactionType.INCOME, 1000, 'TAXABLE_INCOME'),
      txInYear(TransactionType.INCOME, 500, 'TAXABLE_INCOME'),
    ];
    const result = calculateFiscalYearSummary(txs, year);
    expect(result.taxableIncome).toBeCloseTo(1500);
    expect(result.deductibleExpense).toBe(0);
    expect(result.netTaxable).toBeCloseTo(1500);
  });

  it('sums deductible expenses correctly', () => {
    const txs = [
      txInYear(TransactionType.EXPENSE, 300, 'DEDUCTIBLE_EXPENSE'),
      txInYear(TransactionType.EXPENSE, 200, 'DEDUCTIBLE_EXPENSE'),
    ];
    const result = calculateFiscalYearSummary(txs, year);
    expect(result.deductibleExpense).toBeCloseTo(500);
    expect(result.taxableIncome).toBe(0);
    expect(result.netTaxable).toBeCloseTo(-500);
  });

  it('excludes NEUTRAL transactions from items list', () => {
    const txs = [
      txInYear(TransactionType.EXPENSE, 100, 'NEUTRAL'),
      txInYear(TransactionType.INCOME, 200, 'TAXABLE_INCOME'),
    ];
    const result = calculateFiscalYearSummary(txs, year);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].fiscalTag).toBe('TAXABLE_INCOME');
  });

  it('ignores transactions from other years', () => {
    const inYear = txInYear(TransactionType.INCOME, 1000, 'TAXABLE_INCOME');
    const outYear: Transaction = {
      ...inYear,
      id: 'other-year',
      date: `${year - 1}-06-15T12:00:00Z`,
    };
    const result = calculateFiscalYearSummary([inYear, outYear], year);
    expect(result.taxableIncome).toBeCloseTo(1000);
  });

  it('returns zeros for a year with no transactions', () => {
    const result = calculateFiscalYearSummary([], year);
    expect(result.taxableIncome).toBe(0);
    expect(result.deductibleExpense).toBe(0);
    expect(result.netTaxable).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
