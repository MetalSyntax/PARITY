import React from 'react';
import { 
  BalanceCardWidget, 
  BalanceChartWidget, 
  WalletsWidget, 
  ExpenseStructureWidget, 
  ForecastWidget, 
  FiscalSummaryWidget, 
  TransactionsWidget, 
  IncomeVsExpenseWidget, 
  DailySpendingWidget, 
  CategoryBreakdownWidget,
  GoalsWidget
} from '../components/DashboardWidgets';
import { CurrencyConverter } from '../components/CurrencyConverter';
import { WidgetId } from '../types';

export const WIDGET_REGISTRY: Record<WidgetId, (props: any) => React.ReactNode> = {
  balanceCard: (props) => <BalanceCardWidget {...props} />,
  converter: (props) => <CurrencyConverter {...props} />,
  balanceChart: (props) => <BalanceChartWidget {...props} />,
  wallets: (props) => <WalletsWidget {...props} />,
  expenses: (props) => <ExpenseStructureWidget {...props} />,
  forecastCard: (props) => <ForecastWidget {...props} />,
  fiscalSummary: (props) => <FiscalSummaryWidget {...props} />,
  transactions: (props) => <TransactionsWidget {...props} />,
  incomeVsExpense: (props) => <IncomeVsExpenseWidget {...props} />,
  dailySpending: (props) => <DailySpendingWidget {...props} />,
  categoryBreakdown: (props) => <CategoryBreakdownWidget {...props} />,
  goals: (props) => <GoalsWidget {...props} />,
};

export const DEFAULT_LEFT_COLUMN: WidgetId[] = ["balanceCard", "converter", "balanceChart", "wallets", "expenses"];
export const DEFAULT_RIGHT_COLUMN: WidgetId[] = ["forecastCard", "fiscalSummary", "goals", "transactions", "incomeVsExpense", "dailySpending", "categoryBreakdown"];
