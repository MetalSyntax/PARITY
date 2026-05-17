import '../src/polyfills';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { haptics } from '../src/utils/haptics';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { DataProvider } from '../src/context/DataContext';
import { setCryptoEngine } from '@parity/core';
import { mobileCryptoEngine } from '../src/services/cryptoEngine';

// Initialize Crypto Engine for Mobile
setCryptoEngine(mobileCryptoEngine);

function LayoutContent() {
  const { isAuthenticated, authenticate } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check if we are already in the auth screens
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup && !isAuthenticating) {
      router.replace('/(auth)/pin');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isAuthenticating]);

  useEffect(() => {
    handleColdStartAuth();
  }, []);

  const handleColdStartAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to open Parity',
          fallbackLabel: 'Use PIN',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          haptics.success();
          authenticate();
          setIsAuthenticating(false);
        } else {
          // Fallback to PIN
          haptics.heavy();
          setIsAuthenticating(false);
          router.replace('/(auth)/pin');
        }
      } else {
        // No biometrics available, go to PIN
        setIsAuthenticating(false);
        router.replace('/(auth)/pin');
      }
    } catch (error) {
      console.error('Auth error', error);
      setIsAuthenticating(false);
      router.replace('/(auth)/pin');
    }
  };

  if (isAuthenticating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen 
          name="add-transaction" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <DataProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </DataProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
