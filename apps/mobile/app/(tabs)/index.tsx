import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BalanceCard } from '../../components/Dashboard/BalanceCard';
import { QuickActions } from '../../components/Dashboard/QuickActions';
import { TransactionItem } from '../../components/Transactions/TransactionItem';
import { Typography } from '@parity/ui';
import { useData } from '../../src/context/DataContext';
import { Currency, TransactionType, formatAmount } from '@parity/core';
import { haptics } from '../../src/utils/haptics';

export default function DashboardScreen() {
  const { 
    transactions, 
    accounts, 
    userProfile, 
    exchangeRate, 
    euroRate, 
    isBalanceVisible, 
    displayCurrency,
    toggleBalanceVisibility,
    toggleDisplayCurrency
  } = useData();
  const router = useRouter();

  const totalBalanceUSD = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      if (acc.currency === Currency.USD || acc.currency === Currency.USDT) return sum + acc.balance;
      if (acc.currency === Currency.EUR) return sum + (acc.balance * (euroRate || exchangeRate) / exchangeRate);
      return sum + (acc.balance / exchangeRate);
    }, 0);
  }, [accounts, exchangeRate, euroRate]);

  const formattedMain = formatAmount(totalBalanceUSD, exchangeRate, displayCurrency, isBalanceVisible, 2, euroRate);
  
  const secondaryCurrency = displayCurrency === Currency.USD ? Currency.VES : Currency.USD;
  const formattedSecondary = formatAmount(totalBalanceUSD, exchangeRate, secondaryCurrency, isBalanceVisible, 2, euroRate);

  const lastTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  }, [transactions]);

  const handleAction = (id: string) => {
    switch (id) {
      case 'TRANSACTIONS': router.push('/(tabs)/transactions'); break;
      case 'WALLETS': router.push('/(tabs)/wallets'); break;
      case 'PROFILE': router.push('/(tabs)/profile'); break;
      default: break;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
           <Typography variant="h2" weight="black">PARITY</Typography>
        </View>

        <BalanceCard
          amount={formattedMain.split(' ')[1] || formattedMain}
          currency={displayCurrency}
          secondaryAmount={`≈ ${formattedSecondary}`}
          isBalanceVisible={isBalanceVisible}
          onTogglePrivacy={toggleBalanceVisibility}
        />

        <QuickActions onAction={handleAction} />

        <View style={styles.recentHeader}>
          <Typography variant="tiny" color="secondary" weight="black" style={styles.title}>
            RECENT ACTIVITY
          </Typography>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
             <Typography variant="tiny" color="brand" weight="black">VIEW ALL</Typography>
          </TouchableOpacity>
        </View>
        
        {lastTransactions.length === 0 ? (
          <View style={styles.placeholder}>
             <Typography color="secondary" style={{ opacity: 0.5 }}>No recent transactions</Typography>
          </View>
        ) : (
          <View style={styles.recentList}>
            {lastTransactions.map(tx => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                accounts={accounts}
                lang={userProfile?.language || 'en'}
                isBalanceVisible={isBalanceVisible}
                displayCurrency={displayCurrency}
                onPress={(t) => console.log('Selected', t.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          haptics.light();
          router.push('/add-transaction');
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 24, marginTop: 12 },
  recentHeader: { marginTop: 32, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { letterSpacing: 2, opacity: 0.5 },
  recentList: { gap: 4 },
  placeholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderStyle: 'dashed',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  }
});
