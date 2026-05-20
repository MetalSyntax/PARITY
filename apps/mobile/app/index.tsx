import React, { useState } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Note: For this to work in production with local files, 
// you need to bundle the assets and copy them to the document directory.
// For now, we point to a hosted version or a local development URL as fallback.
const REMOTE_URL = 'https://parity-finance.vercel.app'; // Replace with your actual hosted URL

export default function HybridWebWrapper() {
  const [url] = useState(REMOTE_URL);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'web') {
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
    <View style={[styles.safe, { backgroundColor: '#050505' }]}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadEnd={() => setIsLoading(false)}
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
          // Performance and behavior
          decelerationRate="normal"
          allowsFullscreenVideo={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
