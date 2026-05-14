import { View, Text, StyleSheet } from 'react-native';

export default function PinScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});
