import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Globe, FileSpreadsheet, Download, Upload, Cloud, ShieldCheck, Layout, Save, ChevronRight, CheckCircle2, Database, HardDrive, Info, Settings2 } from 'lucide-react';
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
  isSyncing: boolean;
  isAuthenticated: boolean;
  onLogin: () => void;
  onExport: () => void;
  onImport: () => void;
  isDevMode: boolean;
  onDevModeTrigger: () => void;
  navbarFavorites: string[];
  onUpdateNavbarFavorites: (favs: any[]) => void;
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
  onExport,
  onImport,
  isDevMode,
  onDevModeTrigger,
  navbarFavorites,
  onUpdateNavbarFavorites
}) => {
  const [name, setName] = useState(profile.name);
  const [lang, setLang] = useState<Language>(profile.language);
  const t = (key: any) => getTranslation(lang, key);

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleSave = () => {
    onUpdateProfile({ name, language: lang });
    onBack();
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const link = document.createElement("a");
    link.setAttribute("href", content);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
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
    downloadFile(csvContent, `parity_transactions_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleBackupJSON = () => {
    const backup = {
      version: 3,
      date: new Date().toISOString(),
      userProfile: profile,
      accounts,
      transactions,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    downloadFile(dataStr, `parity_backup_${new Date().toISOString().split('T')[0]}.json`, 'text/json');
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col p-6 bg-theme-bg overflow-y-auto overflow-x-hidden no-scrollbar pb-safe"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack} 
            className="p-2.5 bg-theme-surface border border-theme-soft rounded-2xl text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="text-2xl font-black text-theme-primary tracking-tight">{t('profile')}</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-theme-brand rounded-xl text-white font-bold shadow-lg shadow-theme-brand/20 text-sm"
        >
          <Save size={16} /> {t('saveProfile')}
        </motion.button>
      </div>

      <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
        <div className="relative">
          <motion.div 
            onClick={onDevModeTrigger}
            whileHover={{ scale: 1.05 }}
            className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-theme-brand to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-theme-brand/30 cursor-pointer relative z-10 border-4 border-theme-bg"
          >
            {name.slice(0, 1).toUpperCase()}{name.slice(1, 2).toLowerCase()}
          </motion.div>
          <div className="absolute inset-0 bg-theme-brand/20 blur-2xl rounded-full scale-75" />
          
          <AnimatePresence>
            {isDevMode && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-theme-surface border border-theme-soft text-[10px] font-black text-theme-brand uppercase tracking-tighter shadow-xl rounded-full z-20 flex items-center gap-1"
              >
                <ShieldCheck size={10} /> {t('devMode')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex flex-col gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="bg-theme-surface border border-theme-soft rounded-[24px] p-6 space-y-6 shadow-sm">
          <div>
            <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-3 block flex items-center gap-2 opacity-60">
              <User size={12} className="text-theme-brand" /> {t('username')}
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-theme-bg border border-theme-soft rounded-2xl p-4 text-theme-primary font-bold outline-none focus:border-theme-soft/50 focus:ring-1 focus:ring-theme-brand/20 transition-all placeholder:opacity-30"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-3 block flex items-center gap-2 opacity-60">
              <Globe size={12} className="text-theme-brand" /> {t('language')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['en', 'es', 'pt'].map((l) => (
                <motion.button
                  key={l}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLang(l as Language)}
                  className={`p-3 rounded-2xl border font-bold capitalize transition-all ${lang === l ? 'bg-theme-brand border-theme-soft text-white shadow-lg shadow-theme-brand/10' : 'bg-theme-bg border-theme-soft text-theme-secondary'}`}
                >
                  {l === 'en' ? 'EN' : l === 'es' ? 'ES' : 'PT'}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Customization Card */}
        <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.01 }}
            className="bg-theme-surface border border-theme-soft rounded-[24px] p-6 shadow-sm"
        >
          <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-4 block flex items-center gap-2 opacity-60">
            <Layout size={12} className="text-theme-brand" /> {t('navbarFavorites')}
            <span className="ml-auto text-theme-brand font-black">{navbarFavorites.length}/3</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'PROFILE', name: t('profile') },
              { id: 'WALLET', name: t('wallet') },
              { id: 'ANALYSIS', name: t('analysis') },
              { id: 'BUDGET', name: t('envelopes') },
              { id: 'SCHEDULED', name: t('scheduled') },
              { id: 'TRANSACTIONS', name: t('transactions') },
              { id: 'HEATMAP', name: t('heatmap') },
              { id: 'CURRENCY_PERF', name: t('currencyPerformance') }
            ].map((view) => (
              <motion.button
                key={view.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navbarFavorites.includes(view.id)) {
                    onUpdateNavbarFavorites(navbarFavorites.filter(f => f !== view.id));
                  } else if (navbarFavorites.length < 3) {
                    onUpdateNavbarFavorites([...navbarFavorites, view.id]);
                  }
                }}
                className={`p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-between ${navbarFavorites.includes(view.id) ? 'bg-theme-brand/10 border-theme-soft text-theme-brand shadow-inner' : 'bg-theme-bg border-theme-soft text-theme-secondary opacity-70'}`}
              >
                {view.name}
                {navbarFavorites.includes(view.id) && <CheckCircle2 size={12} />}
              </motion.button>
            ))}
          </div>
          <p className="text-[10px] text-theme-secondary mt-4 opacity-50 flex items-center gap-1">
            <Info size={10} /> {t('navbarFavoritesDesc')}
          </p>
        </motion.div>

        {/* Data & Backup Card */}
        <motion.div variants={itemVariants} className="bg-theme-surface border border-theme-soft rounded-[24px] p-6 space-y-6 shadow-sm">
          <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest block flex items-center gap-2 opacity-60">
            <Database size={12} className="text-theme-brand" /> {t('dataManagement')}
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              className="p-4 bg-theme-bg border border-theme-soft hover:border-emerald-500/30 rounded-2xl flex flex-col items-center gap-2 transition-all group shadow-sm"
            >
              <FileSpreadsheet size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-theme-primary uppercase">{t('exportCSV')}</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBackupJSON}
              className="p-4 bg-theme-bg border border-theme-soft hover:border-blue-500/30 rounded-2xl flex flex-col items-center gap-2 transition-all group shadow-sm"
            >
              <Download size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-theme-primary uppercase">{t('backup')}</span>
            </motion.button>
          </div>

          <div className="relative">
            <input type="file" id="import-data" className="hidden" accept=".json" onChange={handleImportFile} />
            <motion.label 
              whileHover={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--primary)' }}
              htmlFor="import-data"
              className="w-full p-4 border-2 border-dashed border-theme-soft rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all bg-theme-bg/50 group"
            >
              <Upload size={20} className="text-theme-secondary group-hover:text-theme-brand transition-colors" />
              <span className="text-xs font-bold text-theme-secondary group-hover:text-theme-brand transition-colors">{t('restoreData')}</span>
            </motion.label>
          </div>
        </motion.div>

        {/* Sync Card */}
        <AnimatePresence>
          {isDevMode && (
            <motion.div 
              key="sync-card"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
              className="bg-theme-surface border border-theme-soft rounded-[28px] p-6 relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 p-3 bg-theme-brand/10 group-hover:bg-theme-brand/20 transition-colors">
                <Cloud size={16} className="text-theme-brand" />
              </div>
              
              <h3 className="text-lg font-black text-theme-primary mb-1 flex items-center gap-2">
                {t('cloudSync')}
              </h3>
              <p className="text-xs text-theme-secondary mb-6 opacity-60">{t('cloudSyncDesc')}</p>
              
              <div className="space-y-3">
                {!isAuthenticated ? (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onLogin}
                    className="w-full py-3.5 rounded-2xl bg-theme-bg text-theme-secondary font-black text-xs uppercase hover:bg-theme-soft transition-colors border border-theme-soft flex items-center justify-center gap-2"
                  >
                    <Settings2 size={14} /> {t('cloudConnect')}
                  </motion.button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onExport}
                      disabled={isSyncing}
                      className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                        isSyncing ? 'bg-theme-brand/20 text-theme-brand animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isSyncing ? t('processing') : t('cloudExport')}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onImport}
                      disabled={isSyncing}
                      className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                        isSyncing ? 'bg-theme-brand/20 text-theme-brand animate-pulse' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {isSyncing ? t('processing') : t('cloudImport')}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants} className="text-center py-8 opacity-40">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-theme-brand animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-primary">Parity Intelligence</span>
          </div>
          <p className="text-[10px] font-mono">v1.0.21</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
