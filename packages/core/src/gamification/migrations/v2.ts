import type { GamificationProfile } from '../schema';

export function migrateProfileToV2(profile: any): GamificationProfile {
  if (!profile) {
    return profile;
  }
  
  if (profile.version && profile.version >= 2) {
    return profile as GamificationProfile;
  }

  return {
    ...profile,
    version: 2,
    dailyGoal: profile.dailyGoal ?? 'steady',
    coins: profile.coins ?? { balance: 0, lifetimeEarned: 0 },
    personalLeague: profile.personalLeague ?? {
      currentTier: 'bronze',
      weekXP: 0,
      lastWeekXP: 0,
      weeksAtCurrentTier: 0,
      tierHistory: [],
    },
    placementCompletedAt: profile.placementCompletedAt ?? null,
    mascotOutfit: profile.mascotOutfit ?? null,
    ownedShopItems: profile.ownedShopItems ?? [],
    updatedAt: new Date().toISOString(),
  };
}
