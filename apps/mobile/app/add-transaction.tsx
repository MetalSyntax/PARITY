import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Currency, TransactionType, CATEGORIES } from '@parity/core';
import { useData } from '../src/context/DataContext';
import { Typography } from '@parity/ui';
import { getCategoryIcon, getCategoryColor } from '../src/utils/iconMap';
import { haptics } from '../src/utils/haptics';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { accounts, userProfile, exchangeRate, euroRate } = useData();
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES[1].id);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [note, setNote] = useState('');

  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 100);
  }, []);

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    haptics.medium();
    // Save logic would go here, updating DataContext/DB
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Typography variant="h3" weight="black">NEW ENTRY</Typography>
          <TouchableOpacity onPress={handleSave}>
            <Typography color="brand" weight="black">SAVE</Typography>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.typeToggle}>
             {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map(t => (
               <TouchableOpacity 
                 key={t}
                 onPress={() => { setType(t); haptics.light(); }}
                 style={[styles.typeButton, type === t && styles.typeButtonActive]}
               >
                 <Typography variant="tiny" weight="black" color={type === t ? 'primary' : 'secondary'}>
                   {t}
                 </Typography>
               </TouchableOpacity>
             ))}
          </View>

          <View style={styles.amountContainer}>
             <Typography variant="h2" color="secondary" style={styles.currencySymbol}>
               {currency === Currency.USD ? '$' : currency === Currency.EUR ? '€' : currency === Currency.USDT ? '₮' : 'Bs'}
             </Typography>
             <TextInput
               ref={amountRef}
               value={amount}
               onChangeText={setAmount}
               placeholder="0.00"
               placeholderTextColor="rgba(255,255,255,0.1)"
               keyboardType="decimal-pad"
               style={styles.amountInput}
             />
          </View>

          <View style={styles.currencyPills}>
            {[Currency.USD, Currency.VES, Currency.EUR, Currency.USDT].map(cur => (
               <TouchableOpacity 
                 key={cur}
                 onPress={() => { setCurrency(cur); haptics.light(); }}
                 style={[styles.pill, currency === cur && styles.pillActive]}
               >
                 <Typography variant="tiny" weight="black" color={currency === cur ? 'primary' : 'secondary'}>
                   {cur}
                 </Typography>
               </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Typography variant="tiny" color="secondary" weight="black" style={styles.label}>CATEGORY</Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
               {CATEGORIES.filter(c => c.id !== 'transfer').map(cat => {
                 const isActive = selectedCategoryId === cat.id;
                 const color = getCategoryColor(cat.id);
                 return (
                   <TouchableOpacity 
                     key={cat.id}
                     onPress={() => { setSelectedCategoryId(cat.id); haptics.light(); }}
                     style={[styles.categoryItem, isActive && { backgroundColor: color + '20', borderColor: color + '40' }]}
                   >
                     <Ionicons 
                       name={getCategoryIcon(cat.id)} 
                       size={20} 
                       color={isActive ? color : '#666'} 
                     />
                     <Typography 
                       variant="tiny" 
                       weight="black" 
                       color={isActive ? 'primary' : 'secondary'}
                     >
                       {cat.id.toUpperCase()}
                     </Typography>
                   </TouchableOpacity>
                 );
               })}
            </ScrollView>
          </View>

          <View style={styles.section}>
             <Typography variant="tiny" color="secondary" weight="black" style={styles.label}>NOTE</Typography>
             <TextInput
               value={note}
               onChangeText={setNote}
               placeholder="What was this for?"
               placeholderTextColor="rgba(255,255,255,0.2)"
               style={styles.noteInput}
             />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20 
  },
  content: { flex: 1, paddingHorizontal: 20 },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  typeButtonActive: {
    backgroundColor: '#333',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  currencySymbol: {
    marginRight: 8,
  },
  amountInput: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 100,
  },
  currencyPills: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#333',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    letterSpacing: 2,
    marginBottom: 16,
    opacity: 0.5,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  noteInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
