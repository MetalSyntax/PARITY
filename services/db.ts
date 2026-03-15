// ... imports
import { Account, Transaction, ScheduledPayment, UserProfile, Budget, Goal } from '../types';
import { encryptData, decryptData } from './crypto';

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
    SHOPPING: 'shopping_items'
};

export type StorageType = 'LOCAL_STORAGE' | 'INDEXED_DB';

export interface AppData {
    exchangeRate: number;
    usdRateParallel?: number;
    euroRate?: number;
    euroRateParallel?: number;
    accounts: Account[];
    transactions: Transaction[];
    scheduledPayments: ScheduledPayment[];
    userProfile: UserProfile;
    budgets: Budget[];
    goals: Goal[];
    rateHistory?: any[];
    shoppingItems?: any[];
}

export class IndexedDBService {
    private db: IDBDatabase | null = null;
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

    public async save(data: AppData): Promise<void> {
        await this.ensureOpen();
        
        // Encrypt everything before opening transaction
        const [encAccounts, encTrans, encSched, encProfile, encMeta, encBudgets, encGoals, encHistory, encShopping] = await Promise.all([
            encryptData(data.accounts),
            encryptData(data.transactions),
            encryptData(data.scheduledPayments),
            encryptData(data.userProfile),
            encryptData({ exchangeRate: data.exchangeRate }),
            encryptData(data.budgets),
            encryptData(data.goals),
            encryptData(data.rateHistory || []),
            encryptData(data.shoppingItems || [])
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
            const keysToFetch = [KEYS.ACCOUNTS, KEYS.TRANSACTIONS, KEYS.SCHEDULED, KEYS.PROFILE, KEYS.METADATA, KEYS.BUDGETS, KEYS.GOALS, KEYS.HISTORY, KEYS.SHOPPING];
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
                        shoppingItems: results[KEYS.SHOPPING] || []
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

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    
    // "Editar" logic in this context is just overwriting specific fields or the whole object.
    // For completeness as requested: "logica para editar"
    public async update(partialData: Partial<AppData>): Promise<void> {
         const current = await this.read();
         if (!current) {
             throw new Error("No data to update");
         }
         const updated = { ...current, ...partialData };
         await this.save(updated);
    }

    private async ensureOpen() {
        if (!this.db) {
            await this.open();
        }
    }
}

export const idbService = new IndexedDBService();
