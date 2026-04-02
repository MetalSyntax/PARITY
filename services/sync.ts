import { idbService } from './db';
import { SyncAction, AppData, EntityType, SyncStatus } from '../types';

export class SyncService {
    private isProcessing = false;

    constructor() {
        window.addEventListener('online', () => this.processQueue());
    }

    /**
     * Pushes a new mutation to the offline queue.
     */
    public async addToQueue(
        entityType: EntityType,
        entityId: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        payload: any
    ): Promise<void> {
        const syncAction: SyncAction = {
            id: crypto.randomUUID(),
            entityType,
            entityId,
            action,
            payload,
            timestamp: Date.now(),
            syncStatus: 'pending'
        };

        await idbService.pushToSyncQueue(syncAction);
        
        if (navigator.onLine) {
            this.processQueue();
        }
    }

    /**
     * Processes the pending queue.
     * This is called automatically when the browser goes online.
     */
    public async processQueue(): Promise<void> {
        if (this.isProcessing || !navigator.onLine) return;
        
        const queue = await idbService.getSyncQueue();
        const pending = queue.filter(a => a.syncStatus === 'pending');
        
        if (pending.length === 0) return;

        this.isProcessing = true;

        try {
            // In a real app, we would talk to an API here.
            // For Parity, "Sync" means merging with the Google Drive backup.
            // This is handled by useGoogleDriveSync indirectly, 
            // but we need a bridge to trigger it with the merged data.
            
            // For now, we emit an event that App.tsx can listen to
            // so it can perform the Drive sync with the latest local state.
            window.dispatchEvent(new CustomEvent('parity-sync-required', { 
                detail: { pendingCount: pending.length } 
            }));
            
            // We don't mark as 'synced' here yet; 
            // we wait for the Drive sync to successfully complete.
        } catch (error) {
            console.error("Queue processing failed", error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Marks all pending items as synced.
     * Should be called after a successful Google Drive export.
     */
    public async markQueueAsSynced(): Promise<void> {
        const queue = await idbService.getSyncQueue();
        for (const action of queue) {
            if (action.syncStatus === 'pending') {
                await idbService.updateSyncStatus(action.id, 'synced');
            }
        }
        await idbService.removeSyncedFromQueue();
    }

    public async getPendingCount(): Promise<number> {
        const queue = await idbService.getSyncQueue();
        return queue.filter(a => a.syncStatus === 'pending').length;
    }
}

export const syncService = new SyncService();
