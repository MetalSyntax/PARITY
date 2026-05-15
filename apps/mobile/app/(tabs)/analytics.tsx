import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Svg, Rect } from 'react-native-svg';
import { useData } from '../../src/context/DataContext';
import { Typography } from '@parity/ui';

export default function AnalyticsScreen() {
  const { transactions } = useData();

  // Simple monthly bar chart mock (would be real logic in production)
  const monthlyData = [
    { label: 'JAN', income: 1200, expense: 800 },
    { label: 'FEB', income: 1500, expense: 900 },
    { label: 'MAR', income: 1100, expense: 1200 },
    { label: 'APR', income: 1800, expense: 700 },
  ];

  const maxVal = Math.max(...monthlyData.flatMap(d => [d.income, d.expense]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2" weight="black">ANALYTICS</Typography>
        </View>

        <View style={styles.card}>
          <Typography variant="tiny" color="secondary" weight="black" style={styles.label}>
            MONTHLY NET FLOW (USD)
          </Typography>
          
          <View style={styles.chartContainer}>
            <Svg height="200" width="100%">
              {monthlyData.map((d, i) => {
                const barWidth = 16;
                const gap = 44;
                const x = 30 + i * (barWidth * 2 + gap);
                const incHeight = (d.income / maxVal) * 150;
                const expHeight = (d.expense / maxVal) * 150;
                
                return (
                  <React.Fragment key={i}>
                    {/* Income Bar */}
                    <Rect 
                      x={x} 
                      y={160 - incHeight} 
                      width={barWidth} 
                      height={incHeight} 
                      fill="#10b981" 
                      rx={4}
                    />
                    {/* Expense Bar */}
                    <Rect 
                      x={x + barWidth + 4} 
                      y={160 - expHeight} 
                      width={barWidth} 
                      height={expHeight} 
                      fill="#ef4444" 
                      rx={4}
                    />
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
          
          <View style={styles.chartLabels}>
             {monthlyData.map((d, i) => (
               <Typography key={i} variant="tiny" color="secondary" weight="bold">{d.label}</Typography>
             ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 24, marginTop: 12 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  label: { letterSpacing: 2, marginBottom: 24, opacity: 0.5 },
  chartContainer: { height: 180, alignItems: 'center' },
  chartLabels: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 8,
    paddingHorizontal: 20
  }
});
