import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@parity/ui';

interface BalanceCardProps {
  amount: string;
  currency: string;
  secondaryAmount: string;
  isBalanceVisible: boolean;
  onTogglePrivacy: () => void;
  trend?: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ 
  amount, 
  currency, 
  secondaryAmount, 
  isBalanceVisible, 
  onTogglePrivacy,
  trend = 0
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Typography variant="tiny" color="secondary" weight="black" style={styles.label}>
          TOTAL BALANCE
        </Typography>
        <TouchableOpacity onPress={onTogglePrivacy} style={styles.privacyBtn}>
          <Ionicons 
            name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} 
            size={20} 
            color="#A0A0A0" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.amountContainer}>
        <Typography variant="h1" weight="black" style={styles.amount}>
          {isBalanceVisible ? amount : '••••••'}
        </Typography>
        <Typography variant="h3" color="secondary" style={styles.currency}>
          {currency}
        </Typography>
      </View>
      
      <Typography variant="small" color="secondary" style={styles.secondaryAmount}>
        {isBalanceVisible ? secondaryAmount : '••••••'}
      </Typography>
      
      <View style={styles.sparkline}>
         <Svg height="60" width="100%">
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#00C853" stopOpacity="0.2" />
                <Stop offset="1" stopColor="#00C853" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path
              d="M0 40 Q 50 10 100 35 Q 150 60 200 20 L 300 30"
              fill="url(#grad)"
            />
            <Path
              d="M0 40 Q 50 10 100 35 Q 150 60 200 20 L 300 30"
              fill="none"
              stroke="#00C853"
              strokeWidth="3"
            />
         </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    letterSpacing: 2,
    opacity: 0.6,
  },
  privacyBtn: {
    padding: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amount: {
    fontSize: 40,
  },
  currency: {
    fontSize: 20,
    opacity: 0.8,
  },
  secondaryAmount: {
    marginTop: 4,
    opacity: 0.5,
  },
  sparkline: {
    marginTop: 20,
    height: 60,
    width: '100%',
    marginLeft: -24,
    marginRight: -24,
    marginBottom: -24,
  },
});
