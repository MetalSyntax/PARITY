import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../../src/context/DataContext';
import { WalletCard } from '../../../components/Wallets/WalletCard';
import { Typography } from '@parity/ui';

export default function WalletsScreen() {
  const { accounts, exchangeRate, euroRate, isBalanceVisible } = useData();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2" weight="black">WALLETS</Typography>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {accounts.map(acc => (
            <WalletCard
              key={acc.id}
              account={acc}
              exchangeRate={exchangeRate}
              euroRate={euroRate}
              isBalanceVisible={isBalanceVisible}
              onPress={(a) => console.log('Selected wallet', a.id)}
            />
          ))}
          
          {accounts.length % 2 !== 0 && <View style={styles.placeholder} />}
        </View>

        {accounts.length === 0 && (
          <View style={styles.empty}>
            <Typography color="secondary">No wallets yet</Typography>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  placeholder: {
    width: '48%',
    aspectRatio: 1,
  },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
});
