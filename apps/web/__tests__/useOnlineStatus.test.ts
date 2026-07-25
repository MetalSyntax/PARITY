import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
}

describe('useOnlineStatus', () => {
  afterEach(() => {
    setNavigatorOnline(true);
  });

  it('reflects navigator.onLine on mount', () => {
    setNavigatorOnline(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(false);
    expect(result.current.reconnectedAt).toBeNull();
  });

  it('flips to offline immediately when the browser fires the offline event', () => {
    setNavigatorOnline(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    expect(result.current.reconnectedAt).toBeNull();
  });

  it('sets reconnectedAt exactly once per online event, so a consumer can toast on reconnect', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.reconnectedAt).toBeNull();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
    const firstReconnect = result.current.reconnectedAt;
    expect(firstReconnect).not.toBeNull();

    // A second, unrelated online event (or re-render) shouldn't be confused with the first —
    // dropping and reconnecting again must produce a new, distinct timestamp so a consumer's
    // useEffect(() => {...}, [reconnectedAt]) fires again. A short real delay guarantees the
    // two Date.now() reads land in different milliseconds instead of racing each other.
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 5));
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.reconnectedAt).not.toBe(firstReconnect);
  });
});
