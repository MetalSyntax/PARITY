import { View, Text, StyleSheet } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parity Dashboard</Text>
      <Text style={styles.subtitle}>Mobile app — coming in Phase 1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#666', fontSize: 14 },
});
