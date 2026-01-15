import { useState, useEffect, useCallback, useRef } from 'react';

// T is now expected to be the full AppData object

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const GOOGLE_TOKEN_KEY = 'google_drive_token_v1';

interface UseGoogleDriveSyncProps<T> {
  fileName: string;
  localData: T;
  setLocalData: (data: T) => void;
  googleClientId: string;
  onSyncSuccess?: () => void;
  onSyncError?: (error: any) => void;
}

export const useGoogleDriveSync = <T extends object>({
  fileName,
  localData,
  setLocalData,
  googleClientId,
  onSyncSuccess,
  onSyncError
}: UseGoogleDriveSyncProps<T>) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [gapiInited, setGapiInited] = useState(false);

  // Robust improvement: Use ref for localData to avoid re-creating syncNow on every data change
  const localDataRef = useRef(localData);
  useEffect(() => {
    localDataRef.current = localData;
  }, [localData]);

  // Check for existing token on mount
  useEffect(() => {
    const savedTokenData = localStorage.getItem(GOOGLE_TOKEN_KEY);
    if (savedTokenData) {
      try {
        const { token, expiresAt } = JSON.parse(savedTokenData);
        if (Date.now() < expiresAt) {
          // Token is still valid
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
        }
      } catch (e) {
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const loadGoogleScripts = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        (window as any).gapi.load('client', async () => {
          await (window as any).gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
          });
          
          // If we have a stored token, apply it to gapi
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
            if (response.error !== undefined) {
              throw (response);
            }
            
            // Save token to localStorage
            const expiresAt = Date.now() + (response.expires_in * 1000);
            localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify({
              token: response.access_token,
              expiresAt
            }));
            
            setIsAuthenticated(true);
          },
        });
        setTokenClient(client);
      };
      document.body.appendChild(script2);
    };

    loadGoogleScripts();
  }, [googleClientId]);

  const handleLogin = useCallback(() => {
    if (tokenClient) {
      // Removing prompt: 'consent' so it only asks when necessary
      // Google will still show the account picker if session is not active or prompt is needed
      tokenClient.requestAccessToken({ prompt: '' });
    }
  }, [tokenClient]);

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
  const importFromCloud = useCallback(async () => {
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

      const fileId = await findFileId(gapi);

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

  return {
    handleLogin,
    exportToCloud,
    importFromCloud,
    isSyncing,
    isAuthenticated
  };
};