import { useState, useEffect, useCallback } from 'react';
import {
  GamificationProfile,
  GamificationResult,
  XPAuditEntry,
  createDefaultProfile,
  processEvent,
  toISODate,
  migrateProfileToV2,
  DailyGoalTier,
  SHOP_CATALOG,
  spendCoins,
  evaluateWeeklyTier,
  offsetDate,
  generateChallenges,
  CHALLENGE_TEMPLATES,
} from '@parity/core';
import type { GamificationEvent } from '@parity/core';
import { idbService } from '@parity/core';

export interface UseGamificationReturn {
  profile: GamificationProfile | null;
  isLoading: boolean;
  dispatchEvent: (event: GamificationEvent) => Promise<GamificationResult | null>;
  pendingRewards: GamificationResult[];
  clearRewards: () => void;
  updateDailyGoal: (goal: DailyGoalTier) => Promise<void>;
  buyShopItem: (itemId: string) => Promise<boolean>;
  equipOutfit: (itemId: string | null) => Promise<void>;
  completePlacementQuiz: (goal: DailyGoalTier) => Promise<void>;
  runWeeklyRecap: () => Promise<void>;
  rerollChallenge: (challengeId: string) => Promise<boolean>;
}

export function useGamification(): UseGamificationReturn {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [pendingRewards, setPendingRewards] = useState<GamificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    idbService.loadGamificationProfile().then(async p => {
      const migrated = p ? migrateProfileToV2(p) : createDefaultProfile();
      // If profile didn't exist or was updated, save it back
      if (!p || p.version !== migrated.version) {
        await idbService.saveGamificationProfile(migrated);
      }
      setProfile(migrated);
      setIsLoading(false);
    });
  }, []);

  const dispatchEvent = useCallback(async (event: GamificationEvent): Promise<GamificationResult | null> => {
    if (!profile) return null;
    const today = toISODate(new Date());
    const auditLog: XPAuditEntry[] = await idbService.loadXPAuditLog();
    const result = processEvent(profile, event, auditLog, today);

    await idbService.saveGamificationProfile(result.updatedProfile);

    if (result.xpGained > 0) {
      await idbService.appendXPAuditEntry({
        eventType: event.type,
        entityId: event.entityId ?? '',
        timestamp: event.timestamp,
        xpGranted: result.xpGained,
      });
    }

    // Accumulate week XP
    const profileWithWeekXP = {
      ...result.updatedProfile,
      personalLeague: {
        ...result.updatedProfile.personalLeague,
        weekXP: result.updatedProfile.personalLeague.weekXP + result.xpGained,
      }
    };
    
    await idbService.saveGamificationProfile(profileWithWeekXP);
    setProfile(profileWithWeekXP);

    if (result.xpGained > 0 || result.newBadges.length > 0 || result.leveledUp) {
      setPendingRewards(prev => [...prev, { ...result, updatedProfile: profileWithWeekXP }]);
    }

    return result;
  }, [profile]);

  const clearRewards = useCallback(() => setPendingRewards([]), []);

  const updateDailyGoal = useCallback(async (goal: DailyGoalTier) => {
    if (!profile) return;
    const updated = { ...profile, dailyGoal: goal };
    await idbService.saveGamificationProfile(updated);
    setProfile(updated);
  }, [profile]);

  const buyShopItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!profile) return false;
    const item = SHOP_CATALOG.find(i => i.id === itemId);
    if (!item) return false;

    if (profile.coins.balance < item.cost) {
      return false; // Insufficient coins
    }

    if (profile.ownedShopItems.includes(itemId) && item.category !== 'streak_freeze') {
      return false; // Already owned (unless it's a consumable streak freeze)
    }

    try {
      const updatedCoins = spendCoins(profile.coins, item.cost);
      const owned = [...profile.ownedShopItems];
      if (!owned.includes(itemId)) {
        owned.push(itemId);
      }

      const updated: GamificationProfile = {
        ...profile,
        coins: updatedCoins,
        ownedShopItems: owned,
        mascotOutfit: item.category === 'mascot_outfit' ? itemId : profile.mascotOutfit,
      };

      // Special action: if buying streak freeze, increment streak freeze counter or token count
      if (itemId === 'streak_freeze_token') {
        updated.streak = {
          ...updated.streak,
          frozenUntil: offsetDate(toISODate(new Date()), 1) // Freeze for tomorrow
        };
      }

      await idbService.saveGamificationProfile(updated);
      setProfile(updated);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [profile]);

  const equipOutfit = useCallback(async (itemId: string | null) => {
    if (!profile) return;
    if (itemId && !profile.ownedShopItems.includes(itemId)) return;

    const updated = { ...profile, mascotOutfit: itemId };
    await idbService.saveGamificationProfile(updated);
    setProfile(updated);
  }, [profile]);

  const completePlacementQuiz = useCallback(async (goal: DailyGoalTier) => {
    if (!profile) return;
    const updated = {
      ...profile,
      dailyGoal: goal,
      placementCompletedAt: new Date().toISOString(),
    };
    await idbService.saveGamificationProfile(updated);
    setProfile(updated);
  }, [profile]);

  const runWeeklyRecap = useCallback(async () => {
    if (!profile) return;
    
    // Calculate simple rolling average of XP from xpLog (e.g. average of last 4 weeks or default 100 XP)
    const rollingAvgXP = 150; 
    const newTier = evaluateWeeklyTier(profile.personalLeague, rollingAvgXP);

    const updatedLeague = {
      ...profile.personalLeague,
      lastWeekXP: profile.personalLeague.weekXP,
      weekXP: 0,
      weeksAtCurrentTier: newTier === profile.personalLeague.currentTier 
        ? profile.personalLeague.weeksAtCurrentTier + 1 
        : 1,
      currentTier: newTier,
      tierHistory: [
        ...profile.personalLeague.tierHistory,
        { tier: profile.personalLeague.currentTier, weekStart: toISODate(new Date()) }
      ],
    };

    const updated = {
      ...profile,
      personalLeague: updatedLeague,
    };

    await idbService.saveGamificationProfile(updated);
    setProfile(updated);
  }, [profile]);

  const rerollChallenge = useCallback(async (challengeId: string): Promise<boolean> => {
    if (!profile) return false;
    const cost = 10;
    if (profile.coins.balance < cost) return false;

    // Deduct coins
    let updatedCoins;
    try {
      updatedCoins = spendCoins(profile.coins, cost);
    } catch {
      return false;
    }

    // Generate a new challenge that is not already assigned
    const today = toISODate(new Date());
    const defaultCtx = {
      hasActiveGoal: profile.stats.totalGoalsCompleted > 0,
      hasActiveBudget: profile.stats.totalBudgetMonthsInGreen > 0,
      hasActiveDebt: profile.stats.totalDebtsSettled > 0,
      exceededCategories: [],
      currentSavingsRate: 0.15,
    };
    
    const newTemplates = generateChallenges(profile, defaultCtx, today);
    const unusedTemplate = newTemplates.find(t => !profile.challengeProgress[t.id]);
    if (!unusedTemplate) return false; // No alternate challenge found

    const target = unusedTemplate.target;
    let targetVal = 1;
    if (target) {
      if ('count' in target) targetVal = target.count;
      else if ('amount' in target) targetVal = target.amount;
      else if ('limit' in target) targetVal = target.limit;
      else if ('envelopeCount' in target) targetVal = target.envelopeCount;
      else if ('days' in target) targetVal = target.days;
      else if ('progressPercent' in target) targetVal = target.progressPercent;
    }

    const expiresAt = unusedTemplate.horizon === 'daily' 
      ? today + 'T23:59:59.999Z'
      : unusedTemplate.horizon === 'weekly'
        ? offsetDate(today, 7) + 'T23:59:59.999Z'
        : offsetDate(today, 30) + 'T23:59:59.999Z';

    const updatedProgress = { ...profile.challengeProgress };
    delete updatedProgress[challengeId];
    updatedProgress[unusedTemplate.id] = {
      challengeId: unusedTemplate.id,
      assignedAt: today + 'T00:00:00.000Z',
      expiresAt,
      current: 0,
      target: targetVal,
      completed: false,
      completedAt: null,
      xpClaimed: false,
    };

    const updated: GamificationProfile = {
      ...profile,
      coins: updatedCoins,
      challengeProgress: updatedProgress,
      updatedAt: new Date().toISOString(),
    };

    await idbService.saveGamificationProfile(updated);
    setProfile(updated);
    return true;
  }, [profile]);

  return {
    profile,
    isLoading,
    dispatchEvent,
    pendingRewards,
    clearRewards,
    updateDailyGoal,
    buyShopItem,
    equipOutfit,
    completePlacementQuiz,
    runWeeklyRecap,
    rerollChallenge,
  };
}
