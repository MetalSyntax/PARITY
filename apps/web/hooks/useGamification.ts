import { useState, useEffect, useCallback } from 'react';
import {
  GamificationProfile,
  GamificationResult,
  XPAuditEntry,
  createDefaultProfile,
  processEvent,
  toISODate,
} from '@parity/core';
import type { GamificationEvent } from '@parity/core';
import { idbService } from '@parity/core';

export interface UseGamificationReturn {
  profile: GamificationProfile | null;
  isLoading: boolean;
  dispatchEvent: (event: GamificationEvent) => Promise<GamificationResult | null>;
  pendingRewards: GamificationResult[];
  clearRewards: () => void;
}

export function useGamification(): UseGamificationReturn {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [pendingRewards, setPendingRewards] = useState<GamificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    idbService.loadGamificationProfile().then(p => {
      setProfile(p ?? createDefaultProfile());
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

    setProfile(result.updatedProfile);

    if (result.xpGained > 0 || result.newBadges.length > 0 || result.leveledUp) {
      setPendingRewards(prev => [...prev, result]);
    }

    return result;
  }, [profile]);

  const clearRewards = useCallback(() => setPendingRewards([]), []);

  return { profile, isLoading, dispatchEvent, pendingRewards, clearRewards };
}
