import type { GamificationEventType } from './events';
import type { LevelId } from './levels';
import type { DailyGoalTier } from './dailyGoal';
import type { CoinWallet } from './coins';
import type { PersonalLeagueState } from './personalLeague';

export interface GamificationProfile {
  version: number;
  xp: number;
  level: LevelId;
  streak: StreakData;
  badges: EarnedBadge[];
  challengeProgress: Record<string, ChallengeProgress>;
  xpLog: XPLogEntry[];
  stats: LifetimeStats;
  createdAt: string;
  updatedAt: string;
  
  // v2 Additions
  dailyGoal: DailyGoalTier;
  coins: CoinWallet;
  personalLeague: PersonalLeagueState;
  placementCompletedAt: string | null;
  mascotOutfit: string | null;   // active ShopItem id, category 'mascot_outfit'
  ownedShopItems: string[];      // ShopItem ids purchased
}

export interface StreakData {
  currentDays: number;
  longestDays: number;
  lastActivityDate: string | null;
  frozenUntil: string | null;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
  xpGranted: number;
}

export interface ChallengeProgress {
  challengeId: string;
  assignedAt: string;
  expiresAt: string;
  current: number;
  target: number;
  completed: boolean;
  completedAt: string | null;
  xpClaimed: boolean;
}

export interface XPLogEntry {
  date: string;
  xp: number;
  source: GamificationEventType;
}

export interface LifetimeStats {
  totalTransactionsLogged: number;
  totalGoalsCompleted: number;
  totalDebtsSettled: number;
  totalBudgetMonthsInGreen: number;
  totalExportsGenerated: number;
}

export interface BadgeDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  family: BadgeFamily;
  xp: number;
  condition: BadgeCondition;
}

export type BadgeFamily =
  | 'first_steps'
  | 'planner'
  | 'consistency'
  | 'multicurrency'
  | 'builder';

export type BadgeCondition =
  | { type: 'stat_gte'; stat: keyof LifetimeStats; value: number }
  | { type: 'level_reached'; level: LevelId }
  | { type: 'streak_days'; days: number }
  | { type: 'event_occurred'; eventType: GamificationEventType }
  | { type: 'badges_earned'; count: number }
  | { type: 'wallet_currency'; currency: string }
  | { type: 'month_in_green'; months: number }
  | { type: 'savings_rate'; rate: number; months: number }
  | { type: 'composite'; all: BadgeCondition[] };

export interface GamificationResult {
  updatedProfile: GamificationProfile;
  xpGained: number;
  newBadges: BadgeDefinition[];
  leveledUp: boolean;
  previousLevel: LevelId | null;
  newLevel: LevelId | null;
  streakBroken: boolean;
  streakMilestone: number | null;
  coinsGained?: number; // v2 addition
}

export interface XPAuditEntry {
  eventType: GamificationEventType;
  entityId: string;
  timestamp: number;
  xpGranted: number;
}

export function createDefaultProfile(): GamificationProfile {
  return {
    version: 2,
    xp: 0,
    level: 'novice',
    streak: {
      currentDays: 0,
      longestDays: 0,
      lastActivityDate: null,
      frozenUntil: null,
    },
    badges: [],
    challengeProgress: {},
    xpLog: [],
    stats: {
      totalTransactionsLogged: 0,
      totalGoalsCompleted: 0,
      totalDebtsSettled: 0,
      totalBudgetMonthsInGreen: 0,
      totalExportsGenerated: 0,
    },
    dailyGoal: 'steady',
    coins: {
      balance: 0,
      lifetimeEarned: 0,
    },
    personalLeague: {
      currentTier: 'bronze',
      weekXP: 0,
      lastWeekXP: 0,
      weeksAtCurrentTier: 0,
      tierHistory: [],
    },
    placementCompletedAt: null,
    mascotOutfit: null,
    ownedShopItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

