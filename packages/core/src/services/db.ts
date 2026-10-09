import { Account, Transaction, ScheduledPayment, UserProfile, Budget, Goal, SyncAction, RateHistoryItem, ShoppingItem, ShoppingList, Contact, Debt, AppData } from '../types';
import { encryptData, decryptData } from './crypto';
import type { GamificationProfile, XPAuditEntry } from '../gamification/schema';

export const DB_NAME = 'parity_db';
export const DB_VERSION = 2; // Bump version for migration
export const STORE_NAME = 'app_data';
// We will deprecate single DATA_KEY for IDB and use separate keys
export const KEYS = {
    ROOT: 'root_data', // Legacy
    ACCOUNTS: 'accounts',
    TRANSACTIONS: 'transactions',
    SCHEDULED: 'scheduled',
    PROFILE: 'profile',
    METADATA: 'metadata',
    BUDGETS: 'budgets',
    GOALS: 'goals',
    HISTORY: 'rate_history',
    SHOPPING: 'shopping_items',
    SHOPPING_LISTS: 'shopping_lists',
    SYNC_QUEUE: 'sync_queue',
    PROFILES: 'profiles',
    ACTIVE_PROFILE_ID: 'active_profile_id',
    CONTACTS: 'contacts',
    DEBTS: 'debts',
    GAMIFICATION_PROFILE: 'gamification_profile',
    XP_AUDIT_LOG: 'xp_audit_log',
};

export type StorageType = 'LOCAL_STORAGE' | 'INDEXED_DB';

export class IndexedDBService {
    private db: IDBDatabase | null = null;
    // Every write goes through this chain so writes land in call order. Without it a slow
    // encrypt of an older snapshot could commit after a newer one and silently drop data.
    private writeChain: Promise<unknown> = Promise.resolve();

    private serialize<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.writeChain.then(fn, fn);
        this.writeChain = run.catch(() => undefined);
        return run;
    }
    // ... constructor, open ...

    public async open(): Promise<void> {
        // ... same open logic ...
        if (this.db) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", request.error);
                reject("Could not open IndexedDB");
            };

            request.onsuccess = (event) => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    // Does NOT write the sync queue: that key is owned by the queue methods below, so a full
    // save (which callers build from React state with `syncQueue: []`) can't wipe pending actions.
    public save(data: AppData): Promise<void> {
        return this.serialize(() => this.writeAll(data));
    }

    private async writeAll(data: AppData): Promise<void> {
        await this.ensureOpen();
        
        // Encrypt everything before opening transaction
        const [encAccounts, encTrans, encSched, encProfile, encMeta, encBudgets, encGoals, encHistory, encShopping, encShoppingLists, encProfiles, encActiveProfileId, encContacts, encDebts] = await Promise.all([
            encryptData(data.accounts),
            encryptData(data.transactions),
            encryptData(data.scheduledPayments),
            encryptData(data.userProfile),
            encryptData({ exchangeRate: data.exchangeRate }),
            encryptData(data.budgets),
            encryptData(data.goals),
            encryptData(data.rateHistory || []),
            encryptData(data.shoppingItems || []),
            encryptData(data.shoppingLists || []),
            encryptData(data.profiles || []),
            encryptData(data.activeProfileId || ''),
            encryptData(data.contacts || []),
            encryptData(data.debts || [])
        ]);

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);

            // Save new granular data
            store.put(encAccounts, KEYS.ACCOUNTS);
            store.put(encTrans, KEYS.TRANSACTIONS);
            store.put(encSched, KEYS.SCHEDULED);
            store.put(encProfile, KEYS.PROFILE);
            store.put(encMeta, KEYS.METADATA);
            store.put(encBudgets, KEYS.BUDGETS);
            store.put(encGoals, KEYS.GOALS);
            store.put(encHistory, KEYS.HISTORY);
            store.put(encShopping, KEYS.SHOPPING);
            store.put(encShoppingLists, KEYS.SHOPPING_LISTS);
            store.put(encProfiles, KEYS.PROFILES);
            store.put(encActiveProfileId, KEYS.ACTIVE_PROFILE_ID);
            store.put(encContacts, KEYS.CONTACTS);
            store.put(encDebts, KEYS.DEBTS);

            // CLEANUP: Remove legacy root key if it exists to prevent read conflicts
            store.delete(KEYS.ROOT);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async read(): Promise<AppData | null> {
        await this.ensureOpen();
        
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], "readonly");
            const store = tx.objectStore(STORE_NAME);
            
            const rawResults: any = {};
            const keysToFetch = [
                KEYS.ACCOUNTS, KEYS.TRANSACTIONS, KEYS.SCHEDULED,
                KEYS.PROFILE, KEYS.METADATA, KEYS.BUDGETS,
                KEYS.GOALS, KEYS.HISTORY, KEYS.SHOPPING,
                KEYS.SHOPPING_LISTS, KEYS.SYNC_QUEUE,
                KEYS.PROFILES, KEYS.ACTIVE_PROFILE_ID,
                KEYS.CONTACTS, KEYS.DEBTS
            ];
            const allKeysToFetch = [...keysToFetch, KEYS.ROOT];
            let fetchCompleted = 0;

            const processResults = async () => {
                const results: any = {};
                for (const key of keysToFetch) {
                    if (rawResults[key]) {
                        try {
                            results[key] = await decryptData(rawResults[key]);
                        } catch (e) {
                            console.warn(`Failed to decrypt ${key}`);
                        }
                    }
                }

                // Check if the essential granular data decrypted successfully
                if (results[KEYS.PROFILE] && results[KEYS.ACCOUNTS]) {
                    const appData: AppData = {
                        accounts: results[KEYS.ACCOUNTS] || [],
                        transactions: results[KEYS.TRANSACTIONS] || [],
                        scheduledPayments: results[KEYS.SCHEDULED] || [],
                        userProfile: results[KEYS.PROFILE],
                        exchangeRate: results[KEYS.METADATA]?.exchangeRate || 0,
                        budgets: results[KEYS.BUDGETS] || [],
                        goals: results[KEYS.GOALS] || [],
                        rateHistory: results[KEYS.HISTORY] || [],
                        shoppingItems: results[KEYS.SHOPPING] || [],
                        shoppingLists: results[KEYS.SHOPPING_LISTS] || [],
                        syncQueue: results[KEYS.SYNC_QUEUE] || [],
                        profiles: results[KEYS.PROFILES] || [],
                        activeProfileId: results[KEYS.ACTIVE_PROFILE_ID] || '',
                        contacts: results[KEYS.CONTACTS] || [],
                        debts: results[KEYS.DEBTS] || []
                    };
                    resolve(appData);
                    return;
                }

                // If granular failed, check ROOT (legacy fallback)
                if (rawResults[KEYS.ROOT]) {
                     try {
                         const data = await decryptData(rawResults[KEYS.ROOT]);
                         if (data) {
                             if (!data.budgets) data.budgets = [];
                             if (!data.goals) data.goals = [];
                             resolve(data);
                             return;
                         }
                     } catch(e) {
                         console.warn("Failed to decrypt legacy ROOT database");
                     }
                }
                
                resolve(null); // Completely failed to read/decrypt anything
            };

            allKeysToFetch.forEach(key => {
                const req = store.get(key);
                req.onsuccess = () => {
                    if (req.result) rawResults[key] = req.result;
                    fetchCompleted++;
                    if (fetchCompleted === allKeysToFetch.length) processResults();
                };
                req.onerror = () => {
                    fetchCompleted++;
                    if (fetchCompleted === allKeysToFetch.length) processResults();
                };
            });
        });
    }

    // Sync Queue Specific Methods — these touch only the SYNC_QUEUE key. They used to
    // read() the whole dataset and save() it back, which could rewrite a snapshot taken
    // before a just-added transaction was committed, losing it if the app was then closed.
    private async readQueue(): Promise<SyncAction[]> {
        await this.ensureOpen();
        const raw = await new Promise<any>((resolve, reject) => {
            const req = this.db!.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).get(KEYS.SYNC_QUEUE);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        if (!raw) return [];
        try {
            return (await decryptData(raw)) || [];
        } catch {
            return [];
        }
    }

    private mutateQueue(fn: (queue: SyncAction[]) => SyncAction[]): Promise<void> {
        return this.serialize(async () => {
            const enc = await encryptData(fn(await this.readQueue()));
            await new Promise<void>((resolve, reject) => {
                const tx = this.db!.transaction([STORE_NAME], 'readwrite');
                tx.objectStore(STORE_NAME).put(enc, KEYS.SYNC_QUEUE);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        });
    }

    public pushToSyncQueue(action: any): Promise<void> {
        return this.mutateQueue(queue => [...queue, action]);
    }

    public async getSyncQueue(): Promise<any[]> {
        return this.readQueue();
    }

    public updateSyncStatus(actionId: string, status: 'synced'|'conflict', payload?: any): Promise<void> {
        return this.mutateQueue(queue => queue.map(a =>
            a.id === actionId ? { ...a, syncStatus: status, payload: payload || a.payload } : a
        ));
    }

    public removeSyncedFromQueue(): Promise<void> {
        return this.mutateQueue(queue => queue.filter(a => a.syncStatus !== 'synced'));
    }

    public async delete(): Promise<void> {
        await this.ensureOpen();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.delete(KEYS.ROOT);
            store.delete(KEYS.ACCOUNTS);
            store.delete(KEYS.TRANSACTIONS);
            store.delete(KEYS.SCHEDULED);
            store.delete(KEYS.PROFILE);
            store.delete(KEYS.METADATA);
            store.delete(KEYS.PROFILES);
            store.delete(KEYS.ACTIVE_PROFILE_ID);
            store.delete(KEYS.CONTACTS);
            store.delete(KEYS.DEBTS);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    
    // "Editar" logic in this context is just overwriting specific fields or the whole object.
    // For completeness as requested: "logica para editar"
    public update(partialData: Partial<AppData>): Promise<void> {
        return this.serialize(async () => {
            const current = await this.read();
            if (!current) {
                throw new Error("No data to update");
            }
            await this.writeAll({ ...current, ...partialData });
        });
    }

    public async saveGamificationProfile(profile: GamificationProfile): Promise<void> {
        await this.ensureOpen();
        const enc = await encryptData(profile);
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], 'readwrite');
            tx.objectStore(STORE_NAME).put(enc, KEYS.GAMIFICATION_PROFILE);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async loadGamificationProfile(): Promise<GamificationProfile | null> {
        await this.ensureOpen();
        return new Promise((resolve) => {
            const tx = this.db!.transaction([STORE_NAME], 'readonly');
            const req = tx.objectStore(STORE_NAME).get(KEYS.GAMIFICATION_PROFILE);
            req.onsuccess = async () => {
                if (!req.result) { resolve(null); return; }
                try { resolve(await decryptData(req.result)); }
                catch { resolve(null); }
            };
            req.onerror = () => resolve(null);
        });
    }

    public async loadXPAuditLog(): Promise<XPAuditEntry[]> {
        await this.ensureOpen();
        return new Promise((resolve) => {
            const tx = this.db!.transaction([STORE_NAME], 'readonly');
            const req = tx.objectStore(STORE_NAME).get(KEYS.XP_AUDIT_LOG);
            req.onsuccess = async () => {
                if (!req.result) { resolve([]); return; }
                try { resolve(await decryptData(req.result)); }
                catch { resolve([]); }
            };
            req.onerror = () => resolve([]);
        });
    }

    public async appendXPAuditEntry(entry: XPAuditEntry): Promise<void> {
        const log = await this.loadXPAuditLog();
        const sevenDaysAgo = Date.now() - 7 * 86_400_000;
        const pruned = log.filter(e => e.timestamp > sevenDaysAgo);
        pruned.push(entry);
        await this.ensureOpen();
        const enc = await encryptData(pruned);
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], 'readwrite');
            tx.objectStore(STORE_NAME).put(enc, KEYS.XP_AUDIT_LOG);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    private async ensureOpen() {
        if (!this.db) {
            await this.open();
        }
    }
}

export const idbService = new IndexedDBService();
