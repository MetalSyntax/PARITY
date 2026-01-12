import { useState, useEffect, useCallback, useRef } from 'react';

// T is now expected to be the full AppData object

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

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

  useEffect(() => {
    const loadGoogleScripts = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        (window as any).gapi.load('client', async () => {
          await (window as any).gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
          });
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
            setIsAuthenticated(true);
            // El token se guarda internamente en gapi.client
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
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }, [tokenClient]);

  // Removed complex granular merge logic in favor of full backup replacement
  // as per user request to match "full backup" behavior.

  // 4. El Proceso de Sincronización
  const syncNow = useCallback(async () => {
    if (!gapiInited || !isAuthenticated) return;
    setIsSyncing(true);

    try {
      const gapi = (window as any).gapi;

      const listResponse = await gapi.client.drive.files.list({
        q: `name = '${fileName}' and trashed = false`,
        fields: 'files(id, name)',
      });

      const files = listResponse.result.files;
      const currentLocalData = localDataRef.current;
      let mergedData = currentLocalData;

      if (files && files.length > 0) {
        const fileId = files[0].id;
        
        // For "Full Backup" behavior: we prioritize Local Data as the source of truth to Upload.
        // We simply overwrite the existing cloud file with current local data.
        
        mergedData = currentLocalData; 

        const token = gapi.client.getToken().access_token;
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mergedData),
        });

      } else {
        const fileMetadata = {
          name: fileName,
          mimeType: 'application/json',
        };
        
        const token = gapi.client.getToken().access_token;
        
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

    } catch (error) {
      console.error("Sync Error", error);
      if (onSyncError) onSyncError(error);
    } finally {
      setIsSyncing(false);
    }
  }, [gapiInited, isAuthenticated, fileName, setLocalData, onSyncSuccess, onSyncError]);

  return {
    handleLogin,
    syncNow,
    isSyncing,
    isAuthenticated
  };
};