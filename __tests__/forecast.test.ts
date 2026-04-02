import { calculateLinearRegression, projectMonthEndSpending, calculateRunway } from '../utils/forecast';
import { Transaction, TransactionType, Currency } from '../types';

describe('forecast utils', () => {
  it('calculates linear regression correctly', () => {
    const data: [number, number][] = [
      [1, 2],
      [2, 4],
      [3, 6],
      [4, 8],
    ];
    const { slope, intercept } = calculateLinearRegression(data);
    expect(slope).toBeCloseTo(2);
    expect(intercept).toBeCloseTo(0);
  });

  const generateTransactions = (days: number, dailySpend: number): Transaction[] => {
    const txs: Transaction[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      txs.push({
        id: `tx-${i}`,
        amount: dailySpend,
        originalCurrency: Currency.USD,
        exchangeRate: 1,
        normalizedAmountUSD: dailySpend,
        type: TransactionType.EXPENSE,
        category: 'Food',
        accountId: 'acc-1',
        note: 'Test',
        date: d.toISOString(),
      });
    }
    return txs;
  };

  it('calculates runway correctly', () => {
    // 30 days of 10 USD daily spend = 300 total = 10 daily burn
    const txs = generateTransactions(30, 10);
    const balance = 100; // 100 / 10 = 10 days runway
    const runway = calculateRunway(balance, txs);
    expect(runway).toBe(10);
  });

  it('handles infinite runway', () => {
    const txs: Transaction[] = [];
    const balance = 100;
    const runway = calculateRunway(balance, txs);
    expect(runway).toBe(Infinity);
  });
});
