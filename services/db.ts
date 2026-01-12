// ... imports
import { Account, Transaction, ScheduledPayment, UserProfile, Budget, Goal } from '../types';
import { encryptData, decryptData } from './crypto';

export const DB_NAME = 'dualflow_db';
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
    GOALS: 'goals'
};

export type StorageType = 'LOCAL_STORAGE' | 'INDEXED_DB';

export interface AppData {
    exchangeRate: number;
    accounts: Account[];
    transactions: Transaction[];
    scheduledPayments: ScheduledPayment[];
    userProfile: UserProfile;
    budgets: Budget[];
    goals: Goal[];
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
        const [encAccounts, encTrans, encSched, encProfile, encMeta, encBudgets, encGoals] = await Promise.all([
            encryptData(data.accounts),
            encryptData(data.transactions),
            encryptData(data.scheduledPayments),
            encryptData(data.userProfile),
            encryptData({ exchangeRate: data.exchangeRate }),
            encryptData(data.budgets),
            encryptData(data.goals)
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
            
            const results: any = {};
            const keysToFetch = [KEYS.ACCOUNTS, KEYS.TRANSACTIONS, KEYS.SCHEDULED, KEYS.PROFILE, KEYS.METADATA, KEYS.BUDGETS, KEYS.GOALS];
            
            // fetch all granular keys parallel
            let completed = 0;
            // ... variables ...

            // Helper to check final completion
            const checkCompletion = async () => {
                completed++;
                if (completed === keysToFetch.length) {
                    // Try to construct from granular data
                    if (results[KEYS.PROFILE] && results[KEYS.ACCOUNTS]) {
                        const appData: AppData = {
                            accounts: results[KEYS.ACCOUNTS] || [],
                            transactions: results[KEYS.TRANSACTIONS] || [],
                            scheduledPayments: results[KEYS.SCHEDULED] || [],
                            userProfile: results[KEYS.PROFILE],
                            exchangeRate: results[KEYS.METADATA]?.exchangeRate || 0,
                            budgets: results[KEYS.BUDGETS] || [],
                            goals: results[KEYS.GOALS] || []
                        };
                        resolve(appData);
                        return;
                    }

                    // If granular data missing/incomplete, Fallback to legacy root
                    // ... legacy logic ...
                    const legacyReq = store.get(KEYS.ROOT);
                    legacyReq.onsuccess = async () => {
                        if (legacyReq.result) {
                            try {
                                const data = await decryptData(legacyReq.result);
                                // Ensure legacy data structure supports new fields if they exist
                                if (!data.budgets) data.budgets = [];
                                if (!data.goals) data.goals = [];
                                resolve(data);
                            } catch (e) {
                                console.error("Legacy read failed", e);
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    };
                    legacyReq.onerror = () => resolve(null);
                }
            };

            keysToFetch.forEach(key => {
                const req = store.get(key);
                req.onsuccess = async () => {
                    if (req.result) {
                        try {
                            results[key] = await decryptData(req.result);
                        } catch (e) {
                            console.error(`Failed to decrypt ${key}`, e);
                        }
                    }
                    checkCompletion();
                };
                req.onerror = () => {
                    console.error(`Error reading ${key}`);
                    checkCompletion();
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
