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

export type Language = 'en' | 'es' | 'pt';

export type ViewState = 'DASHBOARD' | 'ADD' | 'SCHEDULED' | 'BUDGET' | 'ANALYSIS' | 'WALLET' | 'PROFILE' | 'TRANSFER' | 'TRANSACTIONS' | 'HEATMAP' | 'CURRENCY_PERF';

export interface UserProfile {
  name: string;
  language: Language;
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
  normalizedAmountUSD: number; // Calculated value in USD at time of transaction
  type: TransactionType;
  category: string;
  accountId: string;
  toAccountId?: string; // For transfers
  note: string;
  date: string; // ISO string
  updatedAt?: string;
  scheduledId?: string;
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
}

export interface Budget {
    categoryId: string;
    limit: number;
    customName?: string;
    customIcon?: string;
    customColor?: string;
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    deadline: string;
    icon: string;
    color: string;
}

export interface ConfirmConfig {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}