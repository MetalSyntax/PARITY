export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface PersonalLeagueState {
  currentTier: LeagueTier;
  weekXP: number;             // resets every Monday
  lastWeekXP: number;         // for the "vs. last week" comparison
  weeksAtCurrentTier: number;
  tierHistory: { tier: LeagueTier; weekStart: string }[];
}

const TIERS: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export function promote(current: LeagueTier): LeagueTier {
  const idx = TIERS.indexOf(current);
  if (idx < TIERS.length - 1) {
    return TIERS[idx + 1];
  }
  return current;
}

export function demote(current: LeagueTier): LeagueTier {
  const idx = TIERS.indexOf(current);
  if (idx > 0) {
    return TIERS[idx - 1];
  }
  return current;
}

export function createDefaultPersonalLeagueState(): PersonalLeagueState {
  return {
    currentTier: 'bronze',
    weekXP: 0,
    lastWeekXP: 0,
    weeksAtCurrentTier: 0,
    tierHistory: [],
  };
}

export function evaluateWeeklyTier(state: PersonalLeagueState, rollingAvgXP: number): LeagueTier {
  const ratio = state.weekXP / Math.max(1, rollingAvgXP);
  if (ratio >= 1.3) return promote(state.currentTier);
  if (ratio <= 0.6) return demote(state.currentTier);
  return state.currentTier;
}
