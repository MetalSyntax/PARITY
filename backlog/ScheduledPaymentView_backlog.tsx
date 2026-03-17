/**
 * BACKLOG - ScheduledPaymentView Unused Code
 * 
 * This file contains helper functions that were previously inside 
 * `views/ScheduledPaymentView.tsx` but are currently unused because 
 * the component uses inline formatting logic for its items.
 */


// Original formatAmount helper that was declared but never called
const formatAmount = (usd: number) => {
  if (!isBalanceVisible) return '******';
  let val = usd;
  let symbol = '$';

  if (displayCurrency === Currency.VES) {
    val = usd * exchangeRate;
    symbol = 'Bs';
  } else if (displayCurrency === Currency.EUR) {
    val = (usd * exchangeRate) / (euroRate || 1);
    symbol = '€';
  }

  return `${symbol}${val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

