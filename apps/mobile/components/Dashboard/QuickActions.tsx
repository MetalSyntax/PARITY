import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@parity/ui';

const ACTIONS = [
  { id: 'TRANSACTIONS', icon: 'receipt-outline', label: 'Activity', color: '#10b981' },
  { id: 'WALLETS', icon: 'wallet-outline', label: 'Wallets', color: '#3b82f6' },
  { id: 'BUDGET', icon: 'pie-chart-outline', label: 'Budget', color: '#f59e0b' },
  { id: 'PROFILE', icon: 'person-outline', label: 'Profile', color: '#6366f1' },
];

interface QuickActionsProps {
  onAction: (id: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  return (
    <View style={styles.container}>
      <Typography variant="tiny" color="secondary" weight="black" style={styles.title}>
        QUICK ACTIONS
      </Typography>
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <TouchableOpacity 
            key={action.id} 
            style={styles.action}
            onPress={() => onAction(action.id)}
          >
            <View style={[styles.iconContainer, { borderColor: action.color + '40', backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Typography variant="tiny" weight="black" style={styles.label}>
              {action.label.toUpperCase()}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 32 },
  title: { letterSpacing: 2, marginBottom: 16, opacity: 0.5 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: 8 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 9, letterSpacing: 1, opacity: 0.6 },
});
