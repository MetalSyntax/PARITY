import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

// Google Client ID: injected from EAS Secrets via app.config.js → Constants.
// Never comes from the JS bundle, so it can't be extracted by reading a .js file.
const GOOGLE_CLIENT_ID: string = (Constants.expoConfig?.extra as any)?.googleClientId ?? '';

// Deep-link scheme registered in app.json intentFilters / iOS scheme
const OAUTH_REDIRECT = 'parity://oauth2callback';

// Loaded URL — still Vercel while CDN dependencies (Tailwind, Tesseract, jsPDF, Google Fonts)
// are bundled externally. Switch to a local file URI once those are self-hosted.
// See apps/web/vite.mobile.config.ts for the offline build setup.
const WEB_URL = 'https://parity-finance.vercel.app';

// ---------- PKCE helpers ----------

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const verifier = btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const raw = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  const challenge = raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return { verifier, challenge };
}

// ---------- Config injected before the page loads ----------
// Runs in the WebView context before any app JS, so App.tsx can read it at module init.
// isNativeWrapper lets useGoogleDriveSync skip the web OAuth popup and use the bridge below.
function buildPreloadScript(clientId: string): string {
  return `
    window.__PARITY_MOBILE_CONFIG__ = {
      isNativeWrapper: true,
      googleClientId: ${JSON.stringify(clientId)},
    };
    true;
  `;
}

// ---------- Main wrapper component ----------

export default function HybridWebWrapper() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pkceRef = useRef<{ verifier: string; challenge: string } | null>(null);
  const insets = useSafeAreaInsets();

  // Called when the web app sends GOOGLE_OAUTH_REQUEST.
  // Opens Google sign-in in the system browser (not a WebView) — satisfies Google's
  // embedded-browser policy (disallowed_useragent error is avoided).
  const handleGoogleOAuth = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      webViewRef.current?.injectJavaScript(`
        window.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify({ type: 'GOOGLE_OAUTH_ERROR', error: 'no_client_id' })
        }));
        true;
      `);
      return;
    }

    try {
      const pkce = await generatePKCE();
      pkceRef.current = pkce;

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: OAUTH_REDIRECT,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/drive.file',
        code_challenge: pkce.challenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'select_account',
      });

      const result = await WebBrowser.openAuthSessionAsync(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        OAUTH_REDIRECT,
        { preferEphemeralSession: false },
      );

      if (result.type !== 'success' || !result.url) {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({ type: 'GOOGLE_OAUTH_ERROR', error: 'cancelled' })
          }));
          true;
        `);
        return;
      }

      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error || !code || !pkceRef.current) {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({ type: 'GOOGLE_OAUTH_ERROR', error: ${JSON.stringify(error ?? 'no_code')} })
          }));
          true;
        `);
        return;
      }

      // Exchange authorization code for access token (PKCE — no client secret needed)
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          code,
          code_verifier: pkceRef.current.verifier,
          grant_type: 'authorization_code',
          redirect_uri: OAUTH_REDIRECT,
        }).toString(),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        // Deliver token to the web app via a window message event
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'GOOGLE_OAUTH_TOKEN',
              accessToken: ${JSON.stringify(tokenData.access_token)},
              expiresIn: ${tokenData.expires_in ?? 3600}
            })
          }));
          true;
        `);
      } else {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({ type: 'GOOGLE_OAUTH_ERROR', error: 'token_exchange_failed' })
          }));
          true;
        `);
      }
    } catch (err) {
      console.error('[Parity] OAuth error:', err);
    }
  }, []);

  // Receives messages from the web app (window.ReactNativeWebView.postMessage)
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data?.type === 'GOOGLE_OAUTH_REQUEST') {
          handleGoogleOAuth();
        }
      } catch {
        // Ignore non-JSON messages (e.g. from third-party scripts)
      }
    },
    [handleGoogleOAuth],
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          src={WEB_URL}
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
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          style={styles.webview}
          // Injects __PARITY_MOBILE_CONFIG__ before any app JS executes
          injectedJavaScriptBeforeContentLoaded={buildPreloadScript(GOOGLE_CLIENT_ID)}
          onMessage={handleMessage}
          onLoadEnd={() => setIsLoading(false)}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          sharedCookiesEnabled={true}
          // Allow the parity:// deep-link scheme so openAuthSessionAsync can redirect back
          originWhitelist={['https://*', 'parity://*']}
          scalesPageToFit={true}
          decelerationRate="normal"
          allowsFullscreenVideo={true}
        />
        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, backgroundColor: '#050505' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
  },
});
