import type { AppData } from '../types';

export interface BudgetHealth {
  hearts: number;        // 0-5, derived — never persisted, never blocks anything
  reasons: BudgetHealthFlag[];
}

export type BudgetHealthFlag =
  | { type: 'envelope_over_pace'; envelopeId: string; categoryName: string; percentOver: number }
  | { type: 'no_transactions_logged_3_days' }
  | { type: 'savings_rate_negative' };

export function computeBudgetHealth(context: AppData, todayStr: string): BudgetHealth {
  const flags: BudgetHealthFlag[] = [];
  const today = new Date(todayStr + 'T00:00:00Z');
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth(); // 0-indexed
  const currentDay = today.getUTCDate();
  
  // Get total days in current month
  const totalDaysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
  
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // 1. Evaluate envelope pace (envelope_over_pace)
  const budgets = context.budgets || [];
  const transactions = context.transactions || [];
  
  // Filter transactions for the current month and EXPENSE type
  const thisMonthExpenses = transactions.filter(tx => {
    if (tx.type !== 'EXPENSE') return false;
    const txDate = new Date(tx.date);
    const txYear = txDate.getUTCFullYear();
    const txMonth = txDate.getUTCMonth();
    return txYear === currentYear && txMonth === currentMonth;
  });

  for (const budget of budgets) {
    // Only check budgets for current month if specified, or if generic/active
    if (budget.month && budget.month !== currentMonthStr) {
      continue;
    }
    
    const limit = budget.limit;
    if (limit <= 0) continue;

    // Sum expenses for this category
    const spent = thisMonthExpenses
      .filter(tx => tx.category === budget.categoryId)
      .reduce((sum, tx) => sum + tx.normalizedAmountUSD, 0);

    const progressRatio = currentDay / totalDaysInMonth;
    const paceLimit = limit * progressRatio;

    if (spent > paceLimit) {
      const percentOver = Math.round(((spent - paceLimit) / paceLimit) * 100);
      flags.push({
        type: 'envelope_over_pace',
        envelopeId: budget.categoryId,
        categoryName: budget.customName || budget.categoryId,
        percentOver,
      });
    }
  }

  // 2. Check last activity cadence (no_transactions_logged_3_days)
  if (transactions.length > 0) {
    // Find the latest transaction date
    let latestTxTime = 0;
    for (const tx of transactions) {
      const txTime = new Date(tx.date).getTime();
      if (txTime > latestTxTime) {
        latestTxTime = txTime;
      }
    }
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (today.getTime() - latestTxTime > threeDaysMs) {
      flags.push({ type: 'no_transactions_logged_3_days' });
    }
  } else {
    // No transactions logged at all, trigger flag
    flags.push({ type: 'no_transactions_logged_3_days' });
  }

  // 3. Savings rate (savings_rate_negative)
  // Calculate total income and expense this month
  const thisMonthTrans = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const txYear = txDate.getUTCFullYear();
    const txMonth = txDate.getUTCMonth();
    return txYear === currentYear && txMonth === currentMonth;
  });

  const totalIncome = thisMonthTrans
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.normalizedAmountUSD, 0);

  const totalExpense = thisMonthTrans
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.normalizedAmountUSD, 0);

  if (totalIncome > 0) {
    const savings = totalIncome - totalExpense;
    if (savings < 0) {
      flags.push({ type: 'savings_rate_negative' });
    }
  } else if (totalExpense > 0) {
    // Expenses but no income logged this month yet
    flags.push({ type: 'savings_rate_negative' });
  }

  // Compute hearts: starts at 5, minus 1 per unique flag type, minimum 0
  const uniqueFlagTypes = new Set(flags.map(f => f.type));
  const hearts = Math.max(0, 5 - uniqueFlagTypes.size);

  return { hearts, reasons: flags };
}
