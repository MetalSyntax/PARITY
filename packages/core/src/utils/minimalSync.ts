import { Transaction, Account, ScheduledPayment, Budget, Goal, ShoppingList, UserProfile } from '../types';

export interface MinimalSyncPayloadInput {
  since: string | null;
  syncedAt: string;
  transactions: Transaction[];
  accounts: Account[];
  scheduledPayments: ScheduledPayment[];
  budgets: Budget[];
  goals: Goal[];
  shoppingLists: ShoppingList[];
  userProfile: UserProfile;
}

export type MinimalSyncTransaction = Omit<Transaction, 'receipt'>;

export interface MinimalSyncPayload {
  __backupType: 'minimal';
  syncedAt: string;
  since: string | null;
  accounts: Account[];
  transactions: MinimalSyncTransaction[];
  scheduledPayments: ScheduledPayment[];
  budgets: Budget[];
  goals: Goal[];
  shoppingLists: ShoppingList[];
  userProfile: UserProfile;
}

/**
 * Builds the payload for the "minimal" cloud sync (as opposed to the full backup): only
 * transactions changed since `since`, and — critically — never the `receipt` field. Receipt
 * images are full-resolution base64 photos (often 1-5MB apiece); shipping even a handful of
 * them turns a sync meant to be kilobytes into tens of megabytes. Receipts still travel via
 * the full backup; this path only needs to keep amounts/categories/dates/balances in sync.
 */
export function buildMinimalSyncPayload(input: MinimalSyncPayloadInput): MinimalSyncPayload {
  const changedTransactions: MinimalSyncTransaction[] = (input.since
    ? input.transactions.filter(t => t.updatedAt && t.updatedAt > input.since!)
    : input.transactions
  ).map(({ receipt, ...rest }) => rest);

  return {
    __backupType: 'minimal',
    syncedAt: input.syncedAt,
    since: input.since,
    accounts: input.accounts,
    transactions: changedTransactions,
    scheduledPayments: input.scheduledPayments,
    budgets: input.budgets,
    goals: input.goals,
    shoppingLists: input.shoppingLists,
    userProfile: input.userProfile,
  };
}
