import { useState, useEffect, useCallback, useRef } from 'react';

// T is now expected to be the full AppData object

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const GOOGLE_TOKEN_KEY = 'google_drive_token_v1';

// When running inside the React Native wrapper, window.ReactNativeWebView is injected
// automatically by react-native-webview. We use it to detect the native context and
// route OAuth through the system browser bridge (avoids Google's disallowed_useragent block).
const IS_NATIVE_WRAPPER =
  typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;

interface UseGoogleDriveSyncProps<T> {
  fileName: string;
  localData: T;
  setLocalData: (data: T) => void;
  googleClientId: string;
  onSyncSuccess?: () => void;
  onSyncError?: (error: any) => void;
  onLoginError?: (error: string) => void;
}

export const useGoogleDriveSync = <T extends object>({
  fileName,
  localData,
  setLocalData,
  googleClientId,
  onSyncSuccess,
  onSyncError,
  onLoginError
}: UseGoogleDriveSyncProps<T>) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [gapiInited, setGapiInited] = useState(false);

  const localDataRef = useRef(localData);
  useEffect(() => {
    localDataRef.current = localData;
  }, [localData]);

  // Restore a valid cached token on mount (works for both web and native wrapper)
  useEffect(() => {
    const savedTokenData = localStorage.getItem(GOOGLE_TOKEN_KEY);
    if (savedTokenData) {
      try {
        const { token, expiresAt } = JSON.parse(savedTokenData);
        if (Date.now() < expiresAt) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
        }
      } catch {
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
      }
    }
  }, []);

  // ── Native wrapper: listen for GOOGLE_OAUTH_TOKEN injected by the React Native shell ──
  // The shell handles OAuth via expo-web-browser (system browser) and injects the
  // resulting access token here, bypassing Google's WebView disallowed_useragent block.
  useEffect(() => {
    if (!IS_NATIVE_WRAPPER) return;

    const handleNativeMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data?.type === 'GOOGLE_OAUTH_TOKEN' && data.accessToken) {
          const expiresAt = Date.now() + (data.expiresIn ?? 3600) * 1000;
          localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify({ token: data.accessToken, expiresAt }));
          if ((window as any).gapi?.client) {
            (window as any).gapi.client.setToken({ access_token: data.accessToken });
          }
          setIsAuthenticated(true);
        }

        if (data?.type === 'GOOGLE_OAUTH_ERROR') {
          if (onLoginError) onLoginError('Error de autenticación con Google: ' + (data.error ?? 'unknown'));
        }
      } catch {
        // ignore non-JSON messages from other sources
      }
    };

    window.addEventListener('message', handleNativeMessage);
    return () => window.removeEventListener('message', handleNativeMessage);
  }, [onLoginError]);

  // ── Web: load gapi + GIS scripts (skipped in native wrapper — not needed) ──
  useEffect(() => {
    if (IS_NATIVE_WRAPPER) return;
    if (!googleClientId) return; // no-op if key is not configured (dev env without .env)

    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.onload = () => {
      (window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({ discoveryDocs: DISCOVERY_DOCS });

        const savedTokenData = localStorage.getItem(GOOGLE_TOKEN_KEY);
        if (savedTokenData) {
          const { token, expiresAt } = JSON.parse(savedTokenData);
          if (Date.now() < expiresAt) {
            (window as any).gapi.client.setToken({ access_token: token });
            setIsAuthenticated(true);
          }
        }

        setGapiInited(true);
      });
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.onload = () => {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error !== undefined) throw response;
          const expiresAt = Date.now() + response.expires_in * 1000;
          localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify({ token: response.access_token, expiresAt }));
          setIsAuthenticated(true);
        },
      });
      setTokenClient(client);
    };
    document.body.appendChild(script2);
  }, [googleClientId]);

  const handleLogin = useCallback(() => {
    if (IS_NATIVE_WRAPPER) {
      // Ask the native shell to open Google OAuth in the system browser
      (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: 'GOOGLE_OAUTH_REQUEST' }));
      return;
    }

    if (tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: '' });
      } catch (err) {
        if (onLoginError) onLoginError('Error al intentar abrir la ventana de Google: ' + err);
      }
    } else {
      if (onLoginError) onLoginError('El cliente de Google no se ha cargado. Verifica si tu navegador está bloqueando scripts de Google.');
    }
  }, [tokenClient, onLoginError]);

  const findFileId = async (gapi: any) => {
    const listResponse = await gapi.client.drive.files.list({
      q: `name = '${fileName}' and trashed = false`,
      fields: 'files(id, name)',
    });
    const files = listResponse.result.files;
    return files && files.length > 0 ? files[0].id : null;
  };

  // 1. EXPORT TO CLOUD (BACKUP)
  const exportToCloud = useCallback(async () => {
    if (!gapiInited || !isAuthenticated) return;
    setIsSyncing(true);

    try {
      const gapi = (window as any).gapi;
      let token = gapi.client.getToken()?.access_token;
      
      // If token missing from gapi but we are "authenticated", try to restore from localStorage
      if (!token) {
        const savedTokenData = localStorage.getItem(GOOGLE_TOKEN_KEY);
        if (savedTokenData) {
          const { token: savedToken, expiresAt } = JSON.parse(savedTokenData);
          if (Date.now() < expiresAt) {
            token = savedToken;
            gapi.client.setToken({ access_token: token });
          }
        }
      }

      if (!token) {
        setIsAuthenticated(false);
        throw new Error("No active session");
      }

      const currentLocalData = localDataRef.current as any;
      const fileId = await findFileId(gapi);

      if (fileId) {
        // Update existing file
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentLocalData),
        });
      } else {
        // Create new file
        const fileMetadata = { name: fileName, mimeType: 'application/json' };
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fileMetadata)
        });
        const fileJson = await createRes.json();
        
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileJson.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentLocalData),
        });
      }

      if (onSyncSuccess) onSyncSuccess();
    } catch (error: any) {
      console.error("Export Error", error);
      if (error?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
      }
      if (onSyncError) onSyncError(error);
    } finally {
      setIsSyncing(false);
    }
  }, [gapiInited, isAuthenticated, fileName, onSyncSuccess, onSyncError]);

  // 2. IMPORT FROM CLOUD (RESTORE)
  const importFromCloud = useCallback(async (fileIdToRestore?: string) => {
    if (!gapiInited || !isAuthenticated) return;
    setIsSyncing(true);

    try {
      const gapi = (window as any).gapi;
      let token = gapi.client.getToken()?.access_token;

      if (!token) {
        const savedTokenData = localStorage.getItem(GOOGLE_TOKEN_KEY);
        if (savedTokenData) {
          const { token: savedToken, expiresAt } = JSON.parse(savedTokenData);
          if (Date.now() < expiresAt) {
            token = savedToken;
            gapi.client.setToken({ access_token: token });
          }
        }
      }

      if (!token) {
        setIsAuthenticated(false);
        throw new Error("No active session");
      }

      let fileId = fileIdToRestore;
      if (!fileId) {
        const listResponse = await gapi.client.drive.files.list({
          q: `name contains 'parity_backup_' and trashed = false`,
          fields: 'files(id, name, modifiedTime)',
          orderBy: 'modifiedTime desc'
        });
        const files = listResponse.result.files;
        if (files && files.length > 0) {
          fileId = files[0].id;
        }
      }

      if (fileId) {
        const fileContent = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const cloudData = await fileContent.json();
        
        if (cloudData) {
          setLocalData(cloudData);
          if (onSyncSuccess) onSyncSuccess();
        }
      } else {
        throw new Error("No backup file found in Google Drive");
      }
    } catch (error: any) {
      console.error("Import Error", error);
      if (error?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
      }
      if (onSyncError) onSyncError(error);
    } finally {
      setIsSyncing(false);
    }
  }, [gapiInited, isAuthenticated, fileName, setLocalData, onSyncSuccess, onSyncError]);

  const listCloudBackups = useCallback(async () => {
    if (!gapiInited || !isAuthenticated) return [];
    setIsSyncing(true);
    try {
      const gapi = (window as any).gapi;
      let token = gapi.client.getToken()?.access_token;
      if (!token) {
        const savedTokenData = localStorage.getItem(GOOGLE_TOKEN_KEY);
        if (savedTokenData) {
          const { token: savedToken, expiresAt } = JSON.parse(savedTokenData);
          if (Date.now() < expiresAt) {
            token = savedToken;
            gapi.client.setToken({ access_token: token });
          }
        }
      }
      if (!token) {
        setIsAuthenticated(false);
        throw new Error("No active session");
      }

      const listResponse = await gapi.client.drive.files.list({
        q: `name contains 'parity_backup_' and trashed = false`,
        fields: 'files(id, name, modifiedTime, size)',
        orderBy: 'modifiedTime desc'
      });
      return listResponse.result.files || [];
    } catch (error) {
      console.error("List Backups Error", error);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [gapiInited, isAuthenticated]);

  return {
    handleLogin,
    exportToCloud,
    importFromCloud,
    listCloudBackups,
    isSyncing,
    isAuthenticated
  };
};