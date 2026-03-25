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

export type ViewState = 'DASHBOARD' | 'ADD' | 'SCHEDULED' | 'BUDGET' | 'ANALYSIS' | 'WALLET' | 'PROFILE' | 'TRANSFER' | 'TRANSACTIONS' | 'HEATMAP' | 'CURRENCY_PERF' | 'SCHEDULED_NOTIFICATIONS' | 'SHOPPING_LIST' | 'INVOICES' | 'GOALS' | 'INCOME';

export interface UserProfile {
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
}

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  balance: number;
  icon: string;
  color?: string; // For UI styling
  payrollClient?: string;
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
  receipt?: string; // Base64 image
  budgetMonth?: string; // YYYY-MM
  skipBalanceUpdate?: boolean;
}

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
    lastNotified?: string; // ISO date string (YYYY-MM-DD)
    notificationsEnabled?: boolean;
}

export interface Budget {
    categoryId: string;
    limit: number;
    month?: string; // YYYY-MM
    customName?: string;
    customIcon?: string;
    customColor?: string;
    parentCategoryId?: string;
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
}

export interface RateHistoryItem {
    date: string; // ISO string (YYYY-MM-DD)
    rate: number;
    currency?: Currency;
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
}

export interface ConfirmConfig {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}