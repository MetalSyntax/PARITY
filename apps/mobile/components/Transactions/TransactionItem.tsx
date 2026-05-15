import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Currency, TransactionType, Account, CATEGORIES } from '@parity/core';
import { getTranslation } from '@parity/i18n';
import { Typography } from '@parity/ui';
import { CurrencyAmount } from '../Common/CurrencyAmount';
import { getCategoryIcon, getCategoryColor } from '../../src/utils/iconMap';

interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
  lang: string;
  isBalanceVisible: boolean;
  displayCurrency: Currency;
  onPress: (t: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  accounts,
  lang,
  isBalanceVisible,
  displayCurrency,
  onPress,
}) => {
  const t = (key: any) => getTranslation(lang as any, key);
  const category = CATEGORIES.find(c => c.id === transaction.category) || CATEGORIES[0];
  const isTransfer = transaction.type === TransactionType.TRANSFER;

  const fromAcc = accounts.find(a => a.id === transaction.accountId);
  const toAcc = accounts.find(a => a.id === transaction.toAccountId);
  const accName = fromAcc?.name || 'Unknown';

  const iconName = isTransfer ? 'swap-horizontal' : getCategoryIcon(transaction.category);
  const iconColor = getCategoryColor(transaction.category);

  return (
    <TouchableOpacity 
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.left}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15', borderColor: iconColor + '30' }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.info}>
          <Typography variant="body" weight="bold" numberOfLines={1} style={styles.title}>
            {isTransfer ? `${fromAcc?.name} → ${toAcc?.name}` : transaction.note || t(category.name as any)}
          </Typography>
          <View style={styles.meta}>
            <Typography variant="tiny" color="secondary" weight="bold">
              {transaction.originalCurrency} • {accName}
            </Typography>
          </View>
        </View>
      </View>
      
      <CurrencyAmount
        amount={transaction.normalizedAmountUSD}
        exchangeRate={transaction.exchangeRate}
        euroRate={transaction.euroRate}
        displayCurrency={displayCurrency}
        isBalanceVisible={isBalanceVisible}
        showSecondary={true}
        type={transaction.type}
        showPlusMinus={!isTransfer}
        weight="black"
        size="body"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    opacity: 0.6,
  },
});
