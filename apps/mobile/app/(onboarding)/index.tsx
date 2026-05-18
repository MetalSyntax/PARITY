import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleFinishOnboarding = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('hasCompletedOnboarding', 'true');
      } else {
        await SecureStore.setItemAsync('hasCompletedOnboarding', 'true');
      }
      router.replace('/(auth)/pin');
    } catch (e) {
      console.error('Error saving onboarding state', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Parity</Text>
      <Text style={styles.subtitle}>Tu centro de finanzas personales.</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleFinishOnboarding}>
        <Text style={styles.buttonText}>Comenzar</Text>
      </TouchableOpacity>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
