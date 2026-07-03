import type { ChallengeProgress } from './schema';
import { CHALLENGE_TEMPLATES } from './challenges';

export function checkPerfectDay(
  challengeProgress: Record<string, ChallengeProgress>,
  dailyGoalMet: boolean,
  today: string,
): boolean {
  const todaysDaily = Object.values(challengeProgress).filter(c => {
    const isAssignedToday = c.assignedAt.startsWith(today);
    if (!isAssignedToday) return false;
    const template = CHALLENGE_TEMPLATES.find(t => t.id === c.challengeId);
    return template?.horizon === 'daily';
  });

  return dailyGoalMet && todaysDaily.length > 0 && todaysDaily.every(c => c.completed);
}

export const PERFECT_DAY_BONUS_XP = 10;
export const PERFECT_DAY_BONUS_COINS = 5;
