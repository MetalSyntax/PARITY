import type { GamificationEventType } from './events';
import type { LevelId } from './levels';

export interface GamificationProfile {
  version: 1;
  xp: number;
  level: LevelId;
  streak: StreakData;
  badges: EarnedBadge[];
  challengeProgress: Record<string, ChallengeProgress>;
  xpLog: XPLogEntry[];
  stats: LifetimeStats;
  createdAt: string;
  updatedAt: string;
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
}

export interface XPAuditEntry {
  eventType: GamificationEventType;
  entityId: string;
  timestamp: number;
  xpGranted: number;
}

export function createDefaultProfile(): GamificationProfile {
  return {
    version: 1,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
