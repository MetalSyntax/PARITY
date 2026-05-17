export type GamificationEventType =
  | 'transaction_created'
  | 'transaction_with_receipt'
  | 'transaction_ocr_used'
  | 'transfer_completed'
  | 'contact_linked_to_transaction'
  | 'goal_created'
  | 'goal_completed'
  | 'budget_created'
  | 'scheduled_payment_created'
  | 'scenario_created'
  | 'daily_streak'
  | 'month_all_budgets_green'
  | 'month_savings_rate_20'
  | 'rate_watch_7_days'
  | 'first_export'
  | 'debt_settled'
  | 'eur_usdt_wallet_added'
  | 'pwa_installed'
  | 'drive_sync_enabled'
  | 'tutorial_completed'
  | 'streak_broken';

export interface GamificationEvent {
  type: GamificationEventType;
  entityId?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export const XP_VALUES: Record<GamificationEventType, number> = {
  transaction_created:             3,
  transaction_with_receipt:        5,
  transaction_ocr_used:            8,
  transfer_completed:              5,
  contact_linked_to_transaction:   4,
  goal_created:                   20,
  goal_completed:                150,
  budget_created:                 15,
  scheduled_payment_created:      10,
  scenario_created:               25,
  daily_streak:                    0,
  month_all_budgets_green:        80,
  month_savings_rate_20:          60,
  rate_watch_7_days:              30,
  first_export:                   40,
  debt_settled:                   50,
  eur_usdt_wallet_added:          20,
  pwa_installed:                  25,
  drive_sync_enabled:             35,
  tutorial_completed:             30,
  streak_broken:                   0,
};

export const DAILY_XP_CAPS: Partial<Record<GamificationEventType, number>> = {
  transaction_created:            15,
  transaction_with_receipt:       25,
  transaction_ocr_used:           24,
  transfer_completed:             15,
  contact_linked_to_transaction:  12,
};
