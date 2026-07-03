import type { GamificationEventType } from './events';

export interface CoinWallet {
  balance: number;
  lifetimeEarned: number;
}

export const COIN_REWARDS: Partial<Record<GamificationEventType, number>> = {
  daily_streak: 0,          // handled via streak milestone bonus below
};

export const STREAK_MILESTONE_COINS: Record<number, number> = {
  3: 5,
  7: 20,
  14: 35,
  30: 60,
  60: 100,
  90: 150,
  180: 250,
  365: 500
};

export const CHALLENGE_COMPLETION_COINS: Record<'daily' | 'weekly' | 'monthly', number> = {
  daily: 3,
  weekly: 10,
  monthly: 25,
};

export interface ShopItem {
  id: string;
  cost: number;
  category: 'streak_freeze' | 'mascot_outfit' | 'theme' | 'widget_flair';
}

export const SHOP_CATALOG: ShopItem[] = [
  { id: 'streak_freeze_token', cost: 50, category: 'streak_freeze' },
  { id: 'mascot_outfit_sombrero', cost: 80, category: 'mascot_outfit' },
  { id: 'mascot_outfit_liqui_liqui', cost: 80, category: 'mascot_outfit' },
  { id: 'theme_midnight_ocean_unlock_early', cost: 200, category: 'theme' },
  { id: 'widget_flair_confetti_gold', cost: 40, category: 'widget_flair' },
];

export function createDefaultCoinWallet(): CoinWallet {
  return {
    balance: 0,
    lifetimeEarned: 0,
  };
}

export function earnCoins(wallet: CoinWallet, amount: number): CoinWallet {
  return {
    balance: wallet.balance + amount,
    lifetimeEarned: wallet.lifetimeEarned + amount,
  };
}

export function spendCoins(wallet: CoinWallet, amount: number): CoinWallet {
  if (wallet.balance < amount) {
    throw new Error('Insufficient coins');
  }
  return {
    ...wallet,
    balance: wallet.balance - amount,
  };
}
