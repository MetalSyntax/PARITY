import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Note: For this to work in production with local files, 
// you need to bundle the assets and copy them to the document directory.
// For now, we point to a hosted version or a local development URL as fallback.
const REMOTE_URL = 'https://parity-finance.vercel.app'; // Replace with your actual hosted URL
const LOCAL_DEV_URL = 'http://192.168.1.100:5173'; // Fallback to local Vite server if needed

export default function HybridWebWrapper() {
  const [url, setUrl] = useState(REMOTE_URL);
  const [isLoading, setIsLoading] = useState(true);

  // In a real production "copy dist" scenario, we would:
  // 1. Copy apps/web/dist to apps/mobile/assets/www
  // 2. Use expo-asset to get the URI of index.html
  // 3. Use a local server or FileSystem to serve it.

  if (Platform.OS === 'web') {
    // On web, we can just redirect or render an iframe, 
    // but usually, Expo Web should just render the same components.
    // However, if we want the "dist" experience:
    return (
      <View style={styles.container}>
        <iframe 
          src={REMOTE_URL} 
          style={{ width: '100%', height: '100%', border: 'none' }} 
          title="Parity Web"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadEnd={() => setIsLoading(isLoading)}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          )}
          // Enable common mobile features for the web app
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          sharedCookiesEnabled={true}
          originWhitelist={['*']}
          scalesPageToFit={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#050505',
  },
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
  },
});
