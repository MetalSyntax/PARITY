import '../src/polyfills';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setCryptoEngine } from '@parity/core';
import { mobileCryptoEngine } from '../src/services/cryptoEngine';

// Initialize Crypto Engine for Mobile
setCryptoEngine(mobileCryptoEngine);

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
