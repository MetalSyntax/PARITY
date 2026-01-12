import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Globe, FileSpreadsheet } from 'lucide-react';
import { UserProfile, Language, Transaction, Account } from '../types';
import { getTranslation } from '../i18n';
import { StorageType } from '../services/db';

interface ProfileViewProps {
  onBack: () => void;
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  transactions: Transaction[];
  accounts: Account[];
  onImportData: (data: any) => void;
  storageType: StorageType;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  // Sync Props
  isSyncing: boolean;
  isAuthenticated: boolean;
  onLogin: () => void;
  onSync: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  onBack, 
  profile, 
  onUpdateProfile, 
  transactions, 
  accounts, 
  onImportData, 
  storageType, 
  showAlert,
  isSyncing,
  isAuthenticated,
  onLogin,
  onSync
}) => {
  const [name, setName] = useState(profile.name);
  const [lang, setLang] = useState<Language>(profile.language);
  const t = (key: any) => getTranslation(lang, key);

  const handleSave = () => {
    onUpdateProfile({ name, language: lang });
    onBack();
  };

  const handleExportCSV = () => {
      // Extended CSV Headers
      const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Note', 'Exchange Rate', 'USD Equivalent'];
      
      const rows = transactions.map(tx => {
          const accName = accounts.find(a => a.id === tx.accountId)?.name || 'Unknown';
          return [
              tx.id,
              new Date(tx.date).toLocaleDateString(),
              tx.type,
              tx.amount,
              tx.originalCurrency,
              tx.category,
              accName,
              `"${tx.note.replace(/"/g, '""')}"`,
              tx.exchangeRate,
              tx.normalizedAmountUSD.toFixed(2)
          ].join(',');
      });

      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
      downloadFile(csvContent, `dualflow_transactions_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleBackupJSON = () => {
      const backup = {
          version: 3,
          date: new Date().toISOString(),
          userProfile: profile,
          accounts,
          transactions,
          // We can also backup exchange rate if needed, but not strictly 'user data' usually. Added anyway.
          exchangeRate: 1 // Placeholder as prop isn't here, but if main state passed it would be. 
          // Since we don't have all state here, we rely on what is passed. 
          // Actually, App passed 'accounts' and 'transactions'.
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
      downloadFile(dataStr, `dualflow_backup_${new Date().toISOString().split('T')[0]}.json`, 'text/json');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
      const link = document.createElement("a");
      link.setAttribute("href", content);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              onImportData(data);
          } catch (error) {
              showAlert('alert_importError', 'error');
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 bg-theme-bg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-theme-primary">{t('profile')}</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-theme-brand to-purple-500 flex items-center justify-center text-4xl font-bold mb-4 text-white">
          {name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ... User Fields ... */}
        <div>
          <label className="text-xs text-theme-secondary mb-2 block flex items-center gap-2">
            <User size={12} /> {t('username')}
          </label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-theme-surface border border-white/10 rounded-xl p-4 text-theme-primary outline-none focus:border-theme-brand"
          />
        </div>

        <div>
           <label className="text-xs text-theme-secondary mb-2 block flex items-center gap-2">
            <Globe size={12} /> {t('language')}
          </label>
           <div className="grid grid-cols-3 gap-2">
             {['en', 'es', 'pt'].map((l) => (
               <button
                 key={l}
                 onClick={() => setLang(l as Language)}
                 className={`p-3 rounded-xl border capitalize transition-colors ${lang === l ? 'bg-theme-brand border-theme-brand text-white' : 'bg-theme-surface border-white/10 text-theme-secondary'}`}
               >
                 {l === 'en' ? 'English' : l === 'es' ? 'Español' : 'Português'}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={handleExportCSV}
                className="p-4 bg-theme-surface border border-white/10 hover:bg-white/5 rounded-xl flex flex-col items-center gap-2 transition-colors"
            >
                <FileSpreadsheet size={24} className="text-emerald-400" />
                <span className="text-xs font-bold text-theme-primary">{t('exportTransactions')}</span>
            </button>
             <button 
                onClick={handleBackupJSON}
                className="p-4 bg-theme-surface border border-white/10 hover:bg-white/5 rounded-xl flex flex-col items-center gap-2 transition-colors"
            >
                <FileSpreadsheet size={24} className="text-blue-400" />
                <span className="text-xs font-bold text-theme-primary">{t('fullBackup')}</span>
            </button>
        </div>

        <div>
             <label className="text-xs text-theme-secondary mb-2 block">{t('restoreData')}</label>
             <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-theme-secondary">{t('clickToUploadBackup')}</span>
                </div>
                <input type="file" className="hidden" accept=".json" onChange={handleImportFile} />
             </label>
        </div>

        {/* Storage Info */}
        <div className="bg-theme-surface border border-white/5 rounded-2xl p-6 mt-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-theme-brand blur-2xl" />
            </div>
            
            <StorageWidget storageType={storageType} t={t} />
        </div>
        
        {/* Google Drive Sync */}
        <div className="bg-theme-surface border border-white/5 rounded-2xl p-6 mt-4 relative overflow-hidden">
            <h3 className="text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
                ☁️ Cloud Sync
            </h3>
            
            <div className="flex flex-col gap-3">
                {!isAuthenticated ? (
                    <button 
                        onClick={onLogin}
                        className="w-full py-3 rounded-xl bg-white/5 text-theme-secondary font-bold hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-center gap-2"
                    >
                        <span>Connect Google Drive</span>
                    </button>
                ) : (
                    <button 
                        onClick={onSync}
                        disabled={isSyncing}
                        className={`w-full py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${
                            isSyncing 
                            ? 'bg-theme-brand/20 border-theme-brand/50 text-theme-brand animate-pulse' 
                            : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                    >
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                )}
                <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wider">
                    {isAuthenticated ? 'Connected to Google Drive' : 'Backup your data to the cloud'}
                </p>
            </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="mt-auto bg-theme-primary text-theme-bg font-bold py-4 rounded-xl"
      >
        {t('saveProfile')}
      </button>
    </div>
  );
};

// Sub-component for Storage Widget to handle async logic cleanly
const StorageWidget = ({ storageType, t }: { storageType: StorageType, t: any }) => {
    const [usage, setUsage] = useState<{ used: number, quota: number } | null>(null);

    useEffect(() => {
        const checkStorage = async () => {
             // Use storageType prop OR fallback to localStorage key if prop is somehow missing
             const effectiveType = storageType || localStorage.getItem('dualflow_storage_type') || 'LOCAL_STORAGE';
             
             if (effectiveType === 'INDEXED_DB') {
                 // Try native estimate first
                 if (navigator.storage && navigator.storage.estimate) {
                     try {
                         const estimate = await navigator.storage.estimate();
                         setUsage({
                             used: estimate.usage || 0,
                             quota: estimate.quota || (1024 * 1024 * 1024) // Fallback 1GB
                         });
                         return; 
                     } catch (e) {
                         console.error("Storage estimate failed", e);
                     }
                 }
                 
                 // Fallback for IDB if estimate API fails but we are in IDB mode
                 setUsage({
                     used: 0, // Unknown
                     quota: 1024 * 1024 * 1024 * 10 // Assume 10GB default for IDB
                 });

             } else {
                 // Check LocalStorage size
                 let total = 0;
                 for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        total += (localStorage[key].length + (key?.length || 0)) * 2;
                    }
                 }
                 setUsage({
                     used: total,
                     quota: 5 * 1024 * 1024 // 5MB Limit
                 });
             }
        };
        checkStorage();
    }, [storageType]);
    
    if (!usage) return <div className="text-xs text-theme-secondary">{t('loadingStorage')}</div>;

    const usedMB = usage.used / (1024 * 1024);
    const quotaMB = usage.quota / (1024 * 1024);
    // Percentage calculation
    let percentage = 0;
    if (usage.quota > 0) {
        percentage = Math.min(100, (usage.used / usage.quota) * 100);
    }
    
    const availableMB = Math.max(0, quotaMB - usedMB);

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-theme-secondary uppercase tracking-widest mb-1">{t('appStorage')} ({storageType === 'INDEXED_DB' ? 'IndexedDB' : 'LocalStorage'})</span>
                    <h3 className="text-xl font-black text-theme-primary">
                        {quotaMB > 500
                            ? // High capacity display
                              availableMB < 1000 
                                ? `${availableMB.toFixed(2)} MB ${t('available')}`
                                : `${(availableMB / 1024).toFixed(2)} GB ${t('available')}`
                            : // Low capacity display
                              `${availableMB.toFixed(2)} MB ${t('available')}`
                        }
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-theme-secondary uppercase opacity-40">
                        {t('limit')}: {quotaMB < 1000 ? `${quotaMB.toFixed(0)} MB` : `${(quotaMB / 1024).toFixed(1)} GB`}
                    </span>
                </div>
            </div>

            <div className="w-full bg-theme-bg h-2 rounded-full overflow-hidden flex">
                <div 
                    className={`h-full transition-all duration-1000 ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-orange-500' : 'bg-theme-brand'}`}
                    style={{ width: `${Math.max(1, percentage)}%` }}
                />
            </div>
            <p className="text-[10px] text-theme-secondary mt-2 opacity-60">
                {usedMB < 1 ? `< 1 MB ${t('used')}` : `${usedMB.toFixed(2)} MB ${t('used')}`}
            </p>
        </>
    );
};