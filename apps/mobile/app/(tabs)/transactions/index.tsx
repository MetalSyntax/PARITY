import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useData } from '../../../src/context/DataContext';
import { TransactionItem } from '../../../components/Transactions/TransactionItem';
import { Typography } from '@parity/ui';

export default function TransactionsScreen() {
  const { transactions, accounts, userProfile, exchangeRate, euroRate, isBalanceVisible, displayCurrency } = useData();

  const sortedTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h2" weight="black">ACTIVITY</Typography>
        </View>

        <FlashList
          data={sortedTransactions}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              accounts={accounts}
              lang={userProfile?.language || 'en'}
              isBalanceVisible={isBalanceVisible}
              displayCurrency={displayCurrency}
              onPress={(t) => console.log('Selected', t.id)}
            />
          )}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Typography color="secondary">No activity yet</Typography>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
});
