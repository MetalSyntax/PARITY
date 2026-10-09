import 'fake-indexeddb/auto';
import { idbService, setCryptoEngine } from '@parity/core';
import type { AppData } from '@parity/core';

// jsdom lacks structuredClone, which fake-indexeddb uses; stored values here are plain strings.
(globalThis as any).structuredClone ??= (v: unknown) => JSON.parse(JSON.stringify(v));

// Identity "encryption" whose latency we control, to reproduce writes finishing out of order.
let slowMarker: string | null = null;
setCryptoEngine({
  encrypt: async (data: any) => {
    const json = JSON.stringify(data);
    if (slowMarker && json.includes(slowMarker)) await new Promise(r => setTimeout(r, 50));
    return json;
  },
  decrypt: async (enc: string) => JSON.parse(enc),
});

const appData = (txIds: string[]): AppData => ({
  exchangeRate: 40,
  accounts: [],
  transactions: txIds.map(id => ({ id })) as any,
  scheduledPayments: [],
  userProfile: { id: 'p', name: 'Test', language: 'es' } as any,
  budgets: [],
  goals: [],
  syncQueue: [],
});

describe('idbService persistence', () => {
  afterEach(() => { slowMarker = null; });

  it('keeps the newest save even when an older save encrypts slower', async () => {
    slowMarker = 'old-tx';
    await Promise.all([
      idbService.save(appData(['old-tx'])),
      idbService.save(appData(['old-tx', 'new-tx'])),
    ]);
    const data = await idbService.read();
    expect(data!.transactions.map(t => t.id)).toEqual(['old-tx', 'new-tx']);
  });

  it('queueing a sync action never rewrites transactions with a stale snapshot', async () => {
    await idbService.save(appData(['a']));
    slowMarker = 'b'; // the save carrying the new transaction is still encrypting...
    await Promise.all([
      idbService.save(appData(['a', 'b'])),
      idbService.pushToSyncQueue({ id: 'q1', syncStatus: 'pending', timestamp: Date.now() }),
    ]);
    const data = await idbService.read();
    expect(data!.transactions.map(t => t.id)).toEqual(['a', 'b']);
    expect((await idbService.getSyncQueue()).map(a => a.id)).toContain('q1');
  });

  it('a full save does not wipe the pending sync queue', async () => {
    await idbService.pushToSyncQueue({ id: 'q2', syncStatus: 'pending', timestamp: Date.now() });
    await idbService.save(appData(['a']));
    expect((await idbService.getSyncQueue()).map(a => a.id)).toContain('q2');
  });
});
