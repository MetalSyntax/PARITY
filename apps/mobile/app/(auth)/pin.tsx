import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { haptics } from '../../src/utils/haptics';
import { useAuth } from '../../src/context/AuthContext';
import { verifyPin } from '../../src/services/auth';

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const { authenticate } = useAuth();

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometrics(hasHardware && isEnrolled);
  };

  const handleBiometricPress = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to open Parity',
    });
    if (result.success) {
      haptics.success();
      authenticate();
    } else {
      haptics.heavy();
    }
  };

  const handlePress = async (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      haptics.light();

      if (newPin.length === 4) {
        const isValid = await verifyPin(newPin);
        if (isValid) {
          haptics.success();
          authenticate();
        } else {
          haptics.heavy();
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      haptics.light();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter PIN</Text>
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length ? styles.dotFilled : null,
                error ? styles.dotError : null,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.pad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.button}
            onPress={() => handlePress(num.toString())}
          >
            <Text style={styles.buttonText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.button}
          onPress={handleBiometricPress}
          disabled={!hasBiometrics}
        >
          {hasBiometrics && <Ionicons name="finger-print" size={32} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handlePress('0')}
        >
          <Text style={styles.buttonText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDelete}
        >
          <Ionicons name="backspace-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  dotsContainer: { flexDirection: 'row', gap: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  dotFilled: { backgroundColor: '#fff', borderColor: '#fff' },
  dotError: { backgroundColor: '#ff4444', borderColor: '#ff4444' },
  pad: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 32, fontWeight: '400' },
});
