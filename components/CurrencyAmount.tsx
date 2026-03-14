import React from 'react';
import { Currency, TransactionType } from '../types';
import { formatAmount, formatSecondaryAmount } from '../utils/formatUtils';

interface CurrencyAmountProps {
  amount: number; // USD Normalized amount
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  showSecondary?: boolean;
  type?: 'income' | 'expense' | 'transfer' | 'neutral' | TransactionType;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  showPlusMinus?: boolean;
  className?: string;
  secondaryClassName?: string;
  weight?: 'normal' | 'medium' | 'bold' | 'black';
  prefix?: string;
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  exchangeRate,
  euroRate,
  displayCurrency,
  isBalanceVisible,
  showSecondary = false,
  type = 'neutral',
  size = 'base',
  showPlusMinus = false,
  className = '',
  secondaryClassName = '',
  weight = 'bold',
  prefix = '',
}) => {
  const isIncome = type === 'income' || type === TransactionType.INCOME;
  const isExpense = type === 'expense' || type === TransactionType.EXPENSE;
  const isTransfer = type === 'transfer' || type === TransactionType.TRANSFER;

  const colorClass = isIncome 
    ? 'text-emerald-500' 
    : isExpense 
      ? 'text-red-500' 
      : isTransfer 
        ? 'text-indigo-400' 
        : 'text-theme-primary';

  const sizeClasses = {
    'xs': 'text-[10px]',
    'sm': 'text-xs',
    'base': 'text-sm',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
  };

  const weightClasses = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'bold': 'font-bold',
    'black': 'font-black',
  };

  const formattedMain = formatAmount(
    amount,
    exchangeRate,
    displayCurrency,
    isBalanceVisible,
    2,
    euroRate
  );

  const formattedSecondary = showSecondary ? formatSecondaryAmount(
    amount,
    exchangeRate,
    displayCurrency,
    isBalanceVisible,
    2,
    euroRate
  ) : null;
  return (
    <span className={`inline-flex flex-col items-end ${className}`}>
      <span className={`${sizeClasses[size]} ${weightClasses[weight]} ${colorClass} tracking-tight`}>
        {prefix || (showPlusMinus ? (isIncome ? '+' : isExpense ? '-' : '') : '')}{formattedMain}
      </span>
      {showSecondary && (
        <span className={`text-[10px] font-bold text-theme-secondary opacity-40 ${secondaryClassName}`}>
          ≈ {formattedSecondary}
        </span>
      )}
    </span>
  );
};
