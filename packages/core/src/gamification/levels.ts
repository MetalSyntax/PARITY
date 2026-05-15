export type LevelId = 'novice' | 'analyst' | 'strategist' | 'architect' | 'cfo';

export interface LevelDefinition {
  id: LevelId;
  nameKey: string;
  minXP: number;
  maxXP: number | null;
  icon: string;
  unlockedFeatures: string[];
  color: string;
}

export const LEVELS: LevelDefinition[] = [
  {
    id: 'novice',
    nameKey: 'gamification_level_novice',
    minXP: 0,
    maxXP: 499,
    icon: '🌱',
    unlockedFeatures: ['onboarding_guide', 'interactive_tutorial'],
    color: 'secondary',
  },
  {
    id: 'analyst',
    nameKey: 'gamification_level_analyst',
    minXP: 500,
    maxXP: 1999,
    icon: '📊',
    unlockedFeatures: ['report_builder', 'weekly_challenges', 'category_badges'],
    color: 'info',
  },
  {
    id: 'strategist',
    nameKey: 'gamification_level_strategist',
    minXP: 2000,
    maxXP: 4999,
    icon: '🏦',
    unlockedFeatures: ['scenario_planner', 'monthly_challenges', 'premium_themes'],
    color: 'success',
  },
  {
    id: 'architect',
    nameKey: 'gamification_level_architect',
    minXP: 5000,
    maxXP: 9999,
    icon: '🧩',
    unlockedFeatures: ['psl_script_engine', 'early_access', 'architect_badge'],
    color: 'warning',
  },
  {
    id: 'cfo',
    nameKey: 'gamification_level_cfo',
    minXP: 10000,
    maxXP: null,
    icon: '🏆',
    unlockedFeatures: ['all_features', 'cfo_badge', 'registry_profile'],
    color: 'danger',
  },
];

export function getLevelForXP(xp: number): LevelId {
  return [...LEVELS].reverse().find(l => xp >= l.minXP)!.id;
}

export function getLevel(id: LevelId): LevelDefinition {
  return LEVELS.find(l => l.id === id)!;
}

export function getXPToNextLevel(xp: number): number | null {
  const current = getLevelForXP(xp);
  const def = getLevel(current);
  if (def.maxXP === null) return null;
  return def.maxXP + 1 - xp;
}

export function getLevelProgress(xp: number): number {
  const current = getLevelForXP(xp);
  const def = getLevel(current);
  if (def.maxXP === null) return 1;
  const range = def.maxXP - def.minXP;
  return Math.min(1, (xp - def.minXP) / range);
}
