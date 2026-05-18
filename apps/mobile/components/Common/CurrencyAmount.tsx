import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Currency, TransactionType } from '@parity/core';
import { formatAmount, formatSecondaryAmount } from '@parity/core';
import { Typography } from '@parity/ui';

interface CurrencyAmountProps {
  amount: number; // USD Normalized amount
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  isBalanceVisible: boolean;
  showSecondary?: boolean;
  type?: 'income' | 'expense' | 'transfer' | 'neutral' | TransactionType;
  size?: 'xs' | 'sm' | 'body' | 'h4' | 'h3' | 'h2';
  showPlusMinus?: boolean;
  weight?: 'normal' | 'medium' | 'bold' | 'black';
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  exchangeRate,
  euroRate,
  displayCurrency,
  isBalanceVisible,
  showSecondary = false,
  type = 'neutral',
  size = 'body',
  showPlusMinus = false,
  weight = 'bold',
}) => {
  const isIncome = type === 'income' || type === TransactionType.INCOME;
  const isExpense = type === 'expense' || type === TransactionType.EXPENSE;
  const isTransfer = type === 'transfer' || type === TransactionType.TRANSFER;

  const color: 'success' | 'error' | 'primary' | 'secondary' | 'brand' = isIncome 
    ? 'success' 
    : isExpense 
      ? 'error' 
      : isTransfer 
        ? 'primary' 
        : 'primary';

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
    <View style={styles.container}>
      <Typography 
        variant={size as any} 
        color={color} 
        weight={weight as any}
        align="right"
      >
        {showPlusMinus ? (isIncome ? '+' : isExpense ? '-' : '') : ''}{formattedMain}
      </Typography>
      {showSecondary && (
        <Typography 
          variant="tiny" 
          color="secondary" 
          weight="bold" 
          align="right"
          style={styles.secondary}
        >
          ≈ {formattedSecondary}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end' },
  secondary: { opacity: 0.4, marginTop: -2 },
});
