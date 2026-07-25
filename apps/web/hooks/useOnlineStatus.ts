import { useEffect, useState } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  /** Timestamp of the most recent 'online' event, or null if the connection hasn't dropped
   *  and come back since mount. Changes exactly once per reconnect — a consumer can watch it
   *  in a useEffect to fire a one-time "connection restored" toast without tracking previous
   *  state itself. */
  reconnectedAt: number | null;
}

/**
 * Tracks navigator.onLine plus the online/offline window events. A sudden connection drop
 * (Wi-Fi cutting out, airplane mode) fires 'offline' immediately — no polling, no timeout —
 * so the UI can reflect it the instant the browser notices.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [reconnectedAt, setReconnectedAt] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReconnectedAt(Date.now());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, reconnectedAt };
}
