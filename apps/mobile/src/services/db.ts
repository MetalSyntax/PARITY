import * as SQLite from 'expo-sqlite';
import { AppData, KEYS } from '@parity/core';
import { encryptData, decryptData } from '@parity/core';

const DB_NAME = 'parity.db';

export class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;

  async open() {
    if (this.db) return;
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_data (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  async save(data: AppData) {
    await this.open();
    // Encrypt exactly like the web version for compatibility
    const [encAccounts, encTrans, encSched, encProfile, encMeta, encBudgets, encGoals, encHistory, encShopping, encShoppingLists, encQueue, encProfiles, encActiveProfileId, encContacts, encDebts] = await Promise.all([
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
      encryptData(data.syncQueue || []),
      encryptData(data.profiles || []),
      encryptData(data.activeProfileId || ''),
      encryptData(data.contacts || []),
      encryptData(data.debts || [])
    ]);

    const items = [
      { key: KEYS.ACCOUNTS, value: encAccounts },
      { key: KEYS.TRANSACTIONS, value: encTrans },
      { key: KEYS.SCHEDULED, value: encSched },
      { key: KEYS.PROFILE, value: encProfile },
      { key: KEYS.METADATA, value: encMeta },
      { key: KEYS.BUDGETS, value: encBudgets },
      { key: KEYS.GOALS, value: encGoals },
      { key: KEYS.HISTORY, value: encHistory },
      { key: KEYS.SHOPPING, value: encShopping },
      { key: KEYS.SHOPPING_LISTS, value: encShoppingLists },
      { key: KEYS.SYNC_QUEUE, value: encQueue },
      { key: KEYS.PROFILES, value: encProfiles },
      { key: KEYS.ACTIVE_PROFILE_ID, value: encActiveProfileId },
      { key: KEYS.CONTACTS, value: encContacts },
      { key: KEYS.DEBTS, value: encDebts },
    ];

    for (const item of items) {
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)',
        item.key,
        item.value
      );
    }
  }

  async read(): Promise<AppData | null> {
    await this.open();
    try {
      const rows = await this.db!.getAllAsync<{ key: string, value: string }>('SELECT * FROM app_data');
      const rawResults: any = {};
      rows.forEach(row => {
        rawResults[row.key] = row.value;
      });

      const keysToFetch = [
        KEYS.ACCOUNTS, KEYS.TRANSACTIONS, KEYS.SCHEDULED,
        KEYS.PROFILE, KEYS.METADATA, KEYS.BUDGETS,
        KEYS.GOALS, KEYS.HISTORY, KEYS.SHOPPING,
        KEYS.SHOPPING_LISTS, KEYS.SYNC_QUEUE,
        KEYS.PROFILES, KEYS.ACTIVE_PROFILE_ID,
        KEYS.CONTACTS, KEYS.DEBTS
      ];

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

      if (results[KEYS.PROFILE] && results[KEYS.ACCOUNTS]) {
        return {
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
      }
    } catch (error) {
      console.error('Failed to read from SQLite', error);
    }

    return null;
  }
}

export const mobileDbService = new SQLiteService();
