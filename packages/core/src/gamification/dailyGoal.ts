import type { XPLogEntry } from './schema';

export type DailyGoalTier = 'light' | 'steady' | 'intense';

export const DAILY_GOAL_XP: Record<DailyGoalTier, number> = {
  light: 15,     // ~1 logged transaction + a rate check
  steady: 35,    // ~3 transactions or 1 transaction + 1 challenge claim
  intense: 70,   // a genuinely active day
};

export function getDailyGoalProgress(xpLog: XPLogEntry[], today: string, goal: DailyGoalTier): {
  earnedToday: number;
  target: number;
  progress: number;   // 0-1, clamped
  metGoal: boolean;
} {
  const earnedToday = xpLog.find(e => e.date === today)?.xp ?? 0;
  const target = DAILY_GOAL_XP[goal];
  return {
    earnedToday,
    target,
    progress: target > 0 ? Math.min(1, earnedToday / target) : 0,
    metGoal: earnedToday >= target,
  };
}
