import { subDays, startOfMonth, getDaysInMonth, differenceInCalendarDays, format } from 'date-fns';
import { Transaction, TransactionType, Budget } from '@parity/core';

/**
 * Calculates simple linear regression.
 */
export function calculateLinearRegression(data: [number, number][]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: data[0][1] };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (const [x, y] of data) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Projects total spending at month-end using linear regression on the last 30 days.
 */
export function projectMonthEndSpending(
  transactions: Transaction[],
  currentDate: Date = new Date(),
): { base: number; optimistic: number; pessimistic: number } {
  const thirtyDaysAgo = subDays(currentDate, 30);

  const recentExpenses = transactions.filter(t => {
    if (t.type !== TransactionType.EXPENSE) return false;
    const tDate = new Date(t.date);
    return tDate >= thirtyDaysAgo && tDate <= currentDate;
  });

  if (recentExpenses.length === 0) {
    return { base: 0, optimistic: 0, pessimistic: 0 };
  }

  const dailySpend = new Map<number, number>();
  for (let i = 0; i <= 30; i++) dailySpend.set(i, 0);

  for (const t of recentExpenses) {
    const diffDays = differenceInCalendarDays(new Date(t.date), thirtyDaysAgo);
    if (diffDays >= 0 && diffDays <= 30) {
      dailySpend.set(diffDays, (dailySpend.get(diffDays) || 0) + t.normalizedAmountUSD);
    }
  }

  const cumulativeData: [number, number][] = [];
  let runningTotal = 0;
  for (let i = 0; i <= 30; i++) {
    runningTotal += dailySpend.get(i) || 0;
    cumulativeData.push([i, runningTotal]);
  }

  const { slope, intercept } = calculateLinearRegression(cumulativeData);

  const daysInMonth = getDaysInMonth(currentDate);
  const currentDayOfMonth = currentDate.getDate();
  const daysRemaining = daysInMonth - currentDayOfMonth;

  const monthStart = startOfMonth(currentDate);
  const currentMonthSpend = transactions
    .filter(t => {
      if (t.type !== TransactionType.EXPENSE) return false;
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= currentDate;
    })
    .reduce((sum, t) => sum + t.normalizedAmountUSD, 0);

  const dailyBurn = Math.max(0, slope);
  const baseForecast = currentMonthSpend + dailyBurn * daysRemaining;
  const variance = dailyBurn * daysRemaining * 0.15;

  // suppress unused-variable warning for intercept
  void intercept;

  return {
    base: baseForecast,
    optimistic: Math.max(currentMonthSpend, baseForecast - variance),
    pessimistic: baseForecast + variance,
  };
}

/**
 * Estimates days until funds are depleted based on the last 30-day burn rate.
 */
export function calculateRunway(
  currentBalance: number,
  transactions: Transaction[],
  currentDate: Date = new Date(),
): number {
  if (currentBalance <= 0) return 0;

  const thirtyDaysAgo = subDays(currentDate, 30);

  const totalSpent = transactions
    .filter(t => {
      if (t.type !== TransactionType.EXPENSE) return false;
      const tDate = new Date(t.date);
      return tDate >= thirtyDaysAgo && tDate <= currentDate;
    })
    .reduce((sum, t) => sum + t.normalizedAmountUSD, 0);

  const averageDailyBurn = totalSpent / 30;
  if (averageDailyBurn === 0) return Infinity;

  return Math.floor(currentBalance / averageDailyBurn);
}

/**
 * Returns categoryIds forecasted to exceed their budget envelope this month.
 */
export function checkBudgetForecasts(
  transactions: Transaction[],
  budgets: Budget[],
  currentDate: Date = new Date(),
): string[] {
  const monthStart = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const currentDayOfMonth = currentDate.getDate();
  const daysRemaining = daysInMonth - currentDayOfMonth;
  const currentMonthStr = format(currentDate, 'yyyy-MM');

  const currentMonthExpenses = transactions.filter(t => {
    if (t.type !== TransactionType.EXPENSE) return false;
    const tDate = new Date(t.date);
    return tDate >= monthStart && tDate <= currentDate;
  });

  const alerts: string[] = [];

  for (const budget of budgets) {
    if (budget.month && budget.month !== currentMonthStr) continue;

    const categorySpend = currentMonthExpenses
      .filter(t => t.category === budget.categoryId)
      .reduce((sum, t) => sum + t.normalizedAmountUSD, 0);

    const dailyBurn = categorySpend / currentDayOfMonth;
    const projectedTotal = categorySpend + dailyBurn * daysRemaining;

    if (projectedTotal > budget.limit && categorySpend <= budget.limit) {
      alerts.push(budget.categoryId);
    }
  }

  return alerts;
}

/**
 * Aggregates fiscal data for a given year.
 */
export function calculateFiscalYearSummary(transactions: Transaction[], year: number) {
  let taxableIncome = 0;
  let deductibleExpense = 0;

  const filtered = transactions.filter(t => new Date(t.date).getFullYear() === year);

  filtered.forEach(t => {
    if (t.fiscalTag === 'TAXABLE_INCOME') taxableIncome += t.normalizedAmountUSD;
    else if (t.fiscalTag === 'DEDUCTIBLE_EXPENSE') deductibleExpense += t.normalizedAmountUSD;
  });

  return {
    year,
    taxableIncome,
    deductibleExpense,
    netTaxable: taxableIncome - deductibleExpense,
    items: filtered.filter(t => t.fiscalTag && t.fiscalTag !== 'NEUTRAL'),
  };
}
