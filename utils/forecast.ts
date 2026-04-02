import { Transaction, TransactionType, Budget } from '../types';

/**
 * Calculates simple linear regression.
 * @param data Array of [x, y] coordinates
 * @returns Object with slope (m) and intercept (b)
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
 * Calculates the total projected spend for the current month.
 * Uses linear regression on cumulative daily spend for the last 30 days.
 * @param transactions All transactions
 * @param currentDate Current date to project from
 * @returns { base, optimistic, pessimistic }
 */
export function projectMonthEndSpending(transactions: Transaction[], currentDate: Date = new Date()): { base: number, optimistic: number, pessimistic: number } {
  // Filter expenses from the last 30 days
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);

  const recentExpenses = transactions.filter(t => {
    if (t.type !== TransactionType.EXPENSE) return false;
    const tDate = new Date(t.date);
    return tDate >= thirtyDaysAgo && tDate <= currentDate;
  });

  if (recentExpenses.length === 0) {
     return { base: 0, optimistic: 0, pessimistic: 0 };
  }

  // Group by day (0 to 30)
  const dailySpend = new Map<number, number>();
  for (let i = 0; i <= 30; i++) {
    dailySpend.set(i, 0);
  }

  for (const t of recentExpenses) {
    const tDate = new Date(t.date);
    const diffTime = Math.abs(tDate.getTime() - thirtyDaysAgo.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 30) {
      const current = dailySpend.get(diffDays) || 0;
      dailySpend.set(diffDays, current + t.normalizedAmountUSD);
    }
  }

  // Create cumulative array
  const cumulativeData: [number, number][] = [];
  let currentTotal = 0;
  for (let i = 0; i <= 30; i++) {
    currentTotal += dailySpend.get(i) || 0;
    cumulativeData.push([i, currentTotal]);
  }

  const { slope, intercept } = calculateLinearRegression(cumulativeData);

  // Determine how many days in the current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDayOfMonth = currentDate.getDate();

  const daysRemaining = daysInMonth - currentDayOfMonth;

  // Slope is the average daily spend trend.
  // We project the remaining days based on this trend.
  // The forecasted total at the end of the month would be:
  // Current month's actual spend so far + (slope * daysRemaining)
  
  // Calculate current month's actual spend
  const startOfMonth = new Date(year, month, 1);
  const currentMonthExpenses = transactions.filter(t => {
     if (t.type !== TransactionType.EXPENSE) return false;
     const tDate = new Date(t.date);
     return tDate >= startOfMonth && tDate <= currentDate;
  });
  const currentMonthSpend = currentMonthExpenses.reduce((sum, t) => sum + t.normalizedAmountUSD, 0);

  // If slope is negative, assume 0 for remaining days
  const dailyBurn = Math.max(0, slope);
  const baseForecast = currentMonthSpend + (dailyBurn * daysRemaining);
  
  // Confidence bands (arbitrary 15% variance for optimistic/pessimistic)
  const variance = dailyBurn * daysRemaining * 0.15;
  
  return {
    base: baseForecast,
    // Optimistic: we spend less than expected
    optimistic: Math.max(currentMonthSpend, baseForecast - variance),
    // Pessimistic: we spend more than expected
    pessimistic: baseForecast + variance
  };
}

/**
 * Calculates the runway in days.
 * @param currentBalance Total balance in USD
 * @param transactions Transactions to determine burn rate
 * @returns Number of days until funds are depleted
 */
export function calculateRunway(currentBalance: number, transactions: Transaction[], currentDate: Date = new Date()): number {
  if (currentBalance <= 0) return 0;
  
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);

  const recentExpenses = transactions.filter(t => {
    if (t.type !== TransactionType.EXPENSE) return false;
    const tDate = new Date(t.date);
    return tDate >= thirtyDaysAgo && tDate <= currentDate;
  });

  const totalSpent = recentExpenses.reduce((sum, t) => sum + t.normalizedAmountUSD, 0);
  const averageDailyBurn = totalSpent / 30;

  if (averageDailyBurn === 0) return Infinity; // Infinite runway if 0 burn

  const runwayDays = currentBalance / averageDailyBurn;
  return Math.floor(runwayDays);
}

/**
 * Checks if the current burn rate puts the user on track to exceed any budget envelope.
 * Returns a list of categoryIds that are forecasted to exceed their budget.
 */
export function checkBudgetForecasts(transactions: Transaction[], budgets: Budget[], currentDate: Date = new Date()): string[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDayOfMonth = currentDate.getDate();
  const daysRemaining = daysInMonth - currentDayOfMonth;

  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Filter expenses for current month
  const currentMonthExpenses = transactions.filter(t => {
     if (t.type !== TransactionType.EXPENSE) return false;
     const tDate = new Date(t.date);
     return tDate >= startOfMonth && tDate <= currentDate;
  });

  const alerts: string[] = [];

  for (const budget of budgets) {
    if (budget.month && budget.month !== currentMonthStr) continue;

    // Calculate current spend for this category
    const categorySpend = currentMonthExpenses
      .filter(t => t.category === budget.categoryId)
      .reduce((sum, t) => sum + t.normalizedAmountUSD, 0);

    // Calculate daily burn for this category
    const dailyBurn = categorySpend / currentDayOfMonth;
    const projectedTotal = categorySpend + (dailyBurn * daysRemaining);

    // Alert if projected to exceed, AND NOT already exceeded (otherwise we'd spam)
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
    if (t.fiscalTag === 'TAXABLE_INCOME') {
      taxableIncome += t.normalizedAmountUSD;
    } else if (t.fiscalTag === 'DEDUCTIBLE_EXPENSE') {
      deductibleExpense += t.normalizedAmountUSD;
    }
  });

  return {
    year,
    taxableIncome,
    deductibleExpense,
    netTaxable: taxableIncome - deductibleExpense,
    items: filtered.filter(t => t.fiscalTag && t.fiscalTag !== 'NEUTRAL')
  };
}
