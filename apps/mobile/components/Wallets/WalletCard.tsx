import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account, Currency, formatAmount } from '@parity/core';
import { Typography } from '@parity/ui';

interface WalletCardProps {
  account: Account;
  exchangeRate: number;
  euroRate?: number;
  isBalanceVisible: boolean;
  onPress: (a: Account) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  account,
  exchangeRate,
  euroRate,
  isBalanceVisible,
  onPress,
}) => {
  const formattedBalance = formatAmount(
    account.balance,
    exchangeRate,
    account.currency,
    isBalanceVisible,
    2,
    euroRate
  );

  const getIcon = () => {
    switch (account.type) {
      case 'CASH': return 'cash-outline';
      case 'BANK': return 'business-outline';
      case 'DIGITAL': return 'phone-portrait-outline';
      case 'CRYPTO': return 'logo-bitcoin';
      default: return 'wallet-outline';
    }
  };

  return (
    <TouchableOpacity 
      onPress={() => onPress(account)}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon() as any} size={20} color="#fff" />
        </View>
        <Typography variant="tiny" weight="black" style={styles.currency}>
          {account.currency}
        </Typography>
      </View>
      
      <View style={styles.body}>
        <Typography variant="h3" weight="black" style={styles.balance}>
          {formattedBalance}
        </Typography>
        <Typography variant="body" weight="bold" color="secondary" style={styles.name}>
          {account.name}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 20,
    width: '48%',
    aspectRatio: 1,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currency: {
    opacity: 0.5,
    letterSpacing: 1,
  },
  body: {
    gap: 2,
  },
  balance: {
    fontSize: 20,
  },
  name: {
    fontSize: 12,
    opacity: 0.6,
  },
});
