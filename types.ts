import React from 'react';

export enum Currency {
  USD = 'USD',
  VES = 'VES',
  EUR = 'EUR',
  USDT = 'USDT'
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  TRANSFER = 'TRANSFER'
}

export type RateType = 'OFFICIAL' | 'PARALLEL';

export type Language = 'en' | 'es' | 'pt';

export type ViewState = 'DASHBOARD' | 'ADD' | 'SCHEDULED' | 'BUDGET' | 'ANALYSIS' | 'WALLET' | 'PROFILE' | 'TRANSFER' | 'TRANSACTIONS' | 'HEATMAP' | 'CURRENCY_PERF' | 'SCHEDULED_NOTIFICATIONS' | 'SHOPPING_LIST' | 'INVOICES' | 'GOALS' | 'INCOME' | 'FISCAL_REPORT' | 'CONTACTS' | 'DEBT_TRACKER' | 'EXPORT' | 'FIN_CALENDAR' | 'IMPORT' | 'PDF_REPORT' | 'SCENARIO_PLANNER';

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export type EntityType = 'ACCOUNT' | 'TRANSACTION' | 'SCHEDULED_PAYMENT' | 'BUDGET' | 'GOAL' | 'SHOPPING_LIST' | 'USER_PROFILE';

export interface SyncAction {
    id: string; // UUID
    entityType: EntityType;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: any;
    timestamp: number;
    syncStatus: SyncStatus;
}

export interface UserProfile {
  id: string;
  name: string;
  language: Language;
  profileImage?: string; // Base64 or URL
  hideWelcome?: boolean;
  hideDevMode?: boolean;
  dashboardTxLimit?: number;
  hideName?: boolean;
  rateType?: RateType;
  notificationsEnabled?: boolean;
  notificationLeadTime?: number; // Days before due date
  smartAlertsEnabled?: boolean;
  dashboardLayout?: DashboardLayout;
  updatedAt?: string;
}

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  balance: number;
  icon: string;
  color?: string; // For UI styling
  payrollClient?: string;
  profileId?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  amount: number; // Stored in original currency
  originalCurrency: Currency;
  exchangeRate: number; // Snapshot of rate at time of transaction
  euroRate?: number; // Snapshot of euro rate at time of transaction
  normalizedAmountUSD: number; // Calculated value in USD at time of transaction
  type: TransactionType;
  category: string;
  accountId: string;
  toAccountId?: string; // For transfers
  note: string;
  date: string; // ISO string
  fee?: number; // Commission/fee for transfers
  updatedAt?: string;
  scheduledId?: string;
  isAutoPosted?: boolean; // For recurring transaction badging
  receipt?: string; // Base64 image
  budgetMonth?: string; // YYYY-MM
  skipBalanceUpdate?: boolean;
  fiscalTag?: FiscalTag;
  profileId?: string;
}

export type FiscalTag = 'TAXABLE_INCOME' | 'DEDUCTIBLE_EXPENSE' | 'NEUTRAL';

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export interface ScheduledPayment {
    id: string;
    name: string;
    amount: number;
    currency: Currency;
    date: string;
    frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Bi-weekly' | 'One-Time';
    type?: TransactionType; // Optional for backward compatibility, defaults to EXPENSE
    category?: string; // Optional for backward compatibility
    accountId?: string; // Required if autoPost is true
    autoPost?: boolean;
    isTemplate?: boolean; // If it's a template from the library
    lastNotified?: string; // ISO date string (YYYY-MM-DD)
    notificationsEnabled?: boolean;
    profileId?: string;
    updatedAt?: string;
}

export interface Budget {
    categoryId: string;
    limit: number;
    month?: string; // YYYY-MM
    customName?: string;
    customIcon?: string;
    customColor?: string;
    parentCategoryId?: string;
    profileId?: string;
    updatedAt?: string;
}

export interface GoalContribution {
    id: string;
    accountId: string;
    amount: number; // Amount in original currency
    originalCurrency: Currency;
    exchangeRate: number;
    euroRate?: number;
    normalizedAmountUSD: number;
    date: string;
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    deadline: string;
    icon: string;
    color: string;
    contributions?: GoalContribution[];
    completed?: boolean;
    categoryId?: string;
    profileId?: string;
    updatedAt?: string;
}

export interface ShoppingItem {
    id: string;
    name: string;
    quantity: string;
    completed: boolean;
    categoryId?: string;
    price?: number;
    currency?: Currency;
}

export interface ShoppingList {
    id: string;
    name: string;
    items: ShoppingItem[];
    createdAt: string;
    profileId?: string;
    updatedAt?: string;
}

export interface RateHistoryItem {
    date: string; // ISO string (YYYY-MM-DD)
    rate: number;
    currency?: Currency;
}

export type WidgetId = 'balanceCard' | 'converter' | 'balanceChart' | 'wallets' | 'expenses' | 'forecastCard' | 'fiscalSummary' | 'transactions' | 'incomeVsExpense' | 'dailySpending' | 'categoryBreakdown' | 'goals';

export interface WidgetConfig {
    id: WidgetId;
    enabled: boolean;
    config?: any;
}

export interface DashboardLayout {
    leftColumn: WidgetId[];
    rightColumn: WidgetId[];
    widgets: WidgetConfig[];
}

export interface AppData {
    exchangeRate: number;
    usdRateParallel?: number;
    euroRate?: number;
    euroRateParallel?: number;
    accounts: Account[];
    transactions: Transaction[];
    scheduledPayments: ScheduledPayment[];
    userProfile: UserProfile;
    budgets: Budget[];
    goals: Goal[];
    rateHistory?: RateHistoryItem[];
    shoppingItems?: ShoppingItem[];
    shoppingLists?: ShoppingList[];
    syncQueue?: SyncAction[];
    profiles?: UserProfile[];
    activeProfileId?: string;
}

export interface ConfirmConfig {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}