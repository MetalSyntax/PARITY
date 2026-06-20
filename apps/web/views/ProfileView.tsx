import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Globe, Upload, Cloud, ShieldCheck, Layout, Save, ChevronRight, CheckCircle2, HardDrive, Info, Settings2, Bell, Trash2, Plus, Users, FileText, Scale, Home, Wallet, PieChart, Receipt, ChartArea, ChartCandlestick, CalendarRange, Calendar1, ShoppingCart, Trophy, TrendingUp, CalendarDays, LineChart, GraduationCap, Pin } from 'lucide-react';
import { TermsModal } from '../components/legal/TermsModal';
import { PrivacyModal } from '../components/legal/PrivacyModal';
import { UserProfile, Language, Transaction, Account } from '@parity/core';
import { getTranslation } from '@parity/i18n';
import { StorageType } from '@parity/core';

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
  onImport: (fileId?: string) => void;
  listCloudBackups: () => Promise<any[]>;
  isDevMode: boolean;
  onDevModeTrigger: () => void;
  navbarFavorites: string[];
  onUpdateNavbarFavorites: (favs: any[]) => void;
  onNavigate: (view: any) => void;
  profiles: UserProfile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
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
  listCloudBackups,
  isDevMode,
  onDevModeTrigger,
  navbarFavorites,
  onUpdateNavbarFavorites,
  onNavigate,
  profiles,
  activeProfileId,
  onSwitchProfile,
  onCreateProfile,
  onDeleteProfile
}) => {
  const [name, setName] = useState(profile.name);
  const [lang, setLang] = useState<Language>(profile.language);
  const [profileImage, setProfileImage] = useState(profile.profileImage || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled || false);
  const [smartAlertsEnabled, setSmartAlertsEnabled] = useState(profile.smartAlertsEnabled !== false); // Default to true
  const [notificationLeadTime, setNotificationLeadTime] = useState(profile.notificationLeadTime || 1);
  const [usdtSpread, setUsdtSpread] = useState(profile.usdtSpread ?? 0);
  const [cloudBackups, setCloudBackups] = useState<any[] | null>(null);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
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
    onUpdateProfile({
      ...profile,
      name,
      language: lang,
      profileImage,
      notificationsEnabled,
      smartAlertsEnabled,
      notificationLeadTime,
      usdtSpread
    });
    onBack();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert(t('imgTooLarge'), 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-theme-primary">{t('profile')}</h1>
            <p className="text-xs text-theme-secondary font-medium">{t('profileSubtitle')}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-theme-brand rounded-2xl text-white font-bold shadow-lg shadow-theme-brand/20 text-sm"
        >
          <Save size={16} /> {t('saveProfile')}
        </motion.button>
      </div>
      
      {/* Profiles Switcher */}
      <motion.div variants={itemVariants} className="mb-8">
        <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-4 block flex items-center gap-2 opacity-60 px-1">
          <Users size={12} className="text-theme-brand" /> {t('profiles')}
        </label>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {profiles.map((p) => {
            const isActive = p.id === activeProfileId;
            return (
              <div key={p.id} className="relative group min-w-[80px]">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSwitchProfile(p.id)}
                  className={`w-20 h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${
                    isActive 
                      ? 'bg-theme-brand shadow-lg shadow-theme-brand/20 border-theme-brand text-white' 
                      : 'bg-theme-surface border-theme-soft text-theme-secondary hover:border-theme-brand/50'
                  }`}
                >
                  {p.profileImage ? (
                    <img src={p.profileImage} alt={p.name} className="w-full h-full object-cover absolute inset-0 opacity-40" />
                  ) : (
                    <div className={`text-lg font-black ${isActive ? 'text-white' : 'text-theme-secondary'}`}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-tighter truncate w-full px-2 text-center relative z-10 ${isActive ? 'bg-black/20 py-0.5' : ''}`}>
                    {p.name}
                  </span>
                </motion.button>
                
                {profiles.length > 1 && !isActive && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t('confirmDeleteProfile'))) {
                        onDeleteProfile(p.id);
                      }
                    }}
                    className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            );
          })}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="w-20 h-20 rounded-2xl border-2 border-dashed border-theme-soft bg-theme-bg/50 text-theme-secondary flex flex-col items-center justify-center gap-1 hover:border-theme-brand/50 hover:text-theme-brand transition-all"
          >
            <Plus size={20} />
            <span className="text-[9px] font-black uppercase">{t('add')}</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
        <div className="relative group">
          <input 
            type="file" 
            id="profile-image-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label htmlFor="profile-image-upload" className="cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 rounded-2xl bg-gradient-to-br from-theme-brand to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-theme-brand/30 relative z-10 border-4 border-theme-bg overflow-hidden"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <>
                  {name.slice(0, 1).toUpperCase()}{name.slice(1, 2).toLowerCase()}
                </>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload size={24} className="text-white" />
              </div>
            </motion.div>
          </label>
          <div className="absolute inset-0 bg-theme-brand/20 blur-2xl rounded-full scale-75" />
          
          {/* Dev mode shield button removed in favor of version tap trigger */}

        </div>
        {!profileImage && (
             <p className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mt-4 opacity-40">
                {t('changeImage')}
             </p>
        )}
      </motion.div>

      <div className="flex flex-col gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="bg-theme-surface border border-theme-soft rounded-2xl p-6 space-y-6 shadow-sm">
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
              {[
                { code: 'en', flag: '🇺🇸', label: 'English' },
                { code: 'es', flag: '🇻🇪', label: 'Español' },
                { code: 'pt', flag: '🇧🇷', label: 'Português' },
              ].map((l) => (
                <motion.button
                  key={l.code}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLang(l.code as Language)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border font-bold transition-all
                    ${lang === l.code
                      ? 'bg-theme-brand border-theme-brand/50 text-white shadow-lg shadow-theme-brand/20 ring-1 ring-theme-brand/30'
                      : 'bg-theme-bg border-theme-soft text-theme-secondary hover:border-theme-brand/30'}`}
                >
                  <span className="text-2xl leading-none">{l.flag}</span>
                  <span className="text-[10px] font-black uppercase tracking-wide leading-none">{l.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Customization Card */}
        <motion.div
          variants={itemVariants}
          className="bg-theme-surface border border-theme-soft rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Layout size={14} className="text-theme-brand" />
            <span className="text-[10px] font-black text-theme-secondary uppercase tracking-widest opacity-60">{t('navbarFavorites')}</span>
            <div className="ml-auto flex items-center gap-1.5 bg-theme-brand/10 border border-theme-brand/20 rounded-full px-3 py-1">
              <span className="text-[11px] font-black text-theme-brand">{navbarFavorites.length}</span>
              <span className="text-[10px] text-theme-brand/60 font-bold">/4</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'DASHBOARD', name: t('dashboard'), Icon: Home, color: 'bg-theme-brand/10 text-theme-brand', fixed: true },
              { id: 'WALLET', name: t('wallet'), Icon: Wallet, color: 'bg-indigo-500/10 text-indigo-400' },
              { id: 'TRANSACTIONS', name: t('transactions'), Icon: Receipt, color: 'bg-emerald-500/10 text-emerald-400' },
              { id: 'ANALYSIS', name: t('analysis'), Icon: ChartArea, color: 'bg-purple-500/10 text-purple-400' },
              { id: 'BUDGET', name: t('envelopes'), Icon: PieChart, color: 'bg-blue-500/10 text-blue-400' },
              { id: 'GOALS', name: t('goals'), Icon: Trophy, color: 'bg-yellow-500/10 text-yellow-500' },
              { id: 'INCOME', name: t('incomeView'), Icon: TrendingUp, color: 'bg-blue-500/10 text-blue-400' },
              { id: 'SCHEDULED', name: t('scheduled'), Icon: Calendar1, color: 'bg-orange-500/10 text-orange-400' },
              { id: 'FISCAL_REPORT', name: t('fiscalReport'), Icon: FileText, color: 'bg-indigo-500/10 text-indigo-400' },
              { id: 'HEATMAP', name: t('heatmap'), Icon: CalendarRange, color: 'bg-red-500/10 text-red-400' },
              { id: 'CURRENCY_PERF', name: t('currencyPerformance'), Icon: ChartCandlestick, color: 'bg-teal-500/10 text-teal-400' },
              { id: 'SHOPPING_LIST', name: t('shoppingList'), Icon: ShoppingCart, color: 'bg-amber-500/10 text-amber-500' },
              { id: 'CONTACTS', name: t('people') || 'People', Icon: Users, color: 'bg-sky-500/10 text-sky-400' },
              { id: 'DEBT_TRACKER', name: t('debts') || 'Debts', Icon: Scale, color: 'bg-rose-500/10 text-rose-400' },
              { id: 'FIN_CALENDAR', name: t('financialCalendar') || 'Calendar', Icon: CalendarDays, color: 'bg-violet-500/10 text-violet-400' },
              { id: 'SCENARIO_PLANNER', name: t('scenarioPlanner') || 'Scenarios', Icon: LineChart, color: 'bg-orange-500/10 text-orange-400' },
              { id: 'ACADEMY', name: t('academy') || 'Academy', Icon: GraduationCap, color: 'bg-violet-500/10 text-violet-400' },
              { id: 'PROFILE', name: t('profile'), Icon: User, color: 'bg-zinc-500/10 text-zinc-400' },
            ] as { id: string; name: string; Icon: React.ElementType; color: string; fixed?: boolean }[]).map((view) => {
              const isActive = navbarFavorites.includes(view.id);
              const isFull = !isActive && navbarFavorites.length >= 4;
              return (
                <motion.button
                  key={view.id}
                  whileHover={!view.fixed ? { scale: 1.04 } : {}}
                  whileTap={!view.fixed ? { scale: 0.94 } : {}}
                  onClick={() => {
                    if (view.fixed) return;
                    if (isActive) {
                      onUpdateNavbarFavorites(navbarFavorites.filter(f => f !== view.id));
                    } else if (!isFull) {
                      onUpdateNavbarFavorites([...navbarFavorites, view.id]);
                    }
                  }}
                  className={`relative flex flex-col items-center gap-2 p-3 pt-3.5 rounded-2xl border transition-all text-center
                    ${isActive
                      ? 'bg-theme-surface border-theme-soft shadow-sm'
                      : isFull
                        ? 'bg-theme-bg border-theme-soft opacity-30 cursor-not-allowed'
                        : 'bg-theme-bg border-theme-soft opacity-60 hover:opacity-90 hover:border-theme-brand/20'}
                    ${view.fixed ? 'cursor-default' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${view.color} ${isActive ? 'opacity-100' : 'opacity-70'}`}
                    style={{ borderColor: 'transparent' }}>
                    <view.Icon size={20} />
                  </div>
                  <span className={`text-[9px] font-black leading-tight line-clamp-1 w-full text-center ${isActive ? 'text-theme-primary' : 'text-theme-secondary'}`}>
                    {view.name}
                  </span>
                  {isActive && !view.fixed && (
                    <CheckCircle2 size={12} className="absolute top-2 right-2 text-theme-brand" />
                  )}
                  {view.fixed && (
                    <Pin size={9} className="absolute top-2 right-2 text-theme-brand opacity-50" />
                  )}
                </motion.button>
              );
            })}
          </div>

          <p className="text-[10px] text-theme-secondary mt-4 opacity-40 flex items-center gap-1">
            <Info size={10} /> {t('navbarFavoritesDesc')}
          </p>
        </motion.div>

        {/* Notifications Card */}
        <motion.div variants={itemVariants} className="bg-theme-surface border border-theme-soft rounded-2xl p-6 space-y-6 shadow-sm">
          <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest block flex items-center gap-2 opacity-60">
            <Bell size={12} className="text-theme-brand" /> {t('notifications')}
          </label>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-theme-primary">{t('enableNotifications')}</span>
                <button
                    onClick={async () => {
                        const next = !notificationsEnabled;
                        if (next && 'Notification' in window && Notification.permission === 'default') {
                            await Notification.requestPermission();
                        }
                        if (next && 'Notification' in window && Notification.permission === 'granted') {
                            // @ts-ignore
                            window.OneSignalDeferred?.push((os: any) => os.User?.PushSubscription?.optIn?.());
                        }
                        setNotificationsEnabled(next);
                    }}
                    className={`w-10 h-5 rounded-full transition-all relative ${notificationsEnabled ? "bg-theme-brand" : "bg-theme-soft"}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notificationsEnabled ? "left-6" : "left-1"}`} />
                </button>
            </div>
            
            <AnimatePresence>
              {notificationsEnabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="flex items-center justify-between pt-2 mt-2">
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-theme-primary">{t('smartAlertsEnabled')}</span>
                          <span className="text-[10px] text-theme-secondary opacity-60 font-medium">{t('smartAlertsDesc')}</span>
                      </div>
                      <button
                          onClick={() => setSmartAlertsEnabled(!smartAlertsEnabled)}
                          className={`w-10 h-5 rounded-full transition-all relative ${smartAlertsEnabled ? "bg-theme-brand" : "bg-theme-soft"}`}
                      >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${smartAlertsEnabled ? "left-6" : "left-1"}`} />
                      </button>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-theme-secondary">{t('notificationLeadTime')}</span>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={notificationLeadTime} 
                        onChange={(e) => setNotificationLeadTime(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 bg-theme-bg border border-theme-soft rounded-2xl px-2 py-1 text-xs font-bold text-theme-primary text-center outline-none"
                        min="0"
                        max="30"
                      />
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('SCHEDULED_NOTIFICATIONS')}
                    className="w-full py-3 bg-theme-bg border border-theme-soft rounded-xl text-xs font-black text-theme-brand uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Settings2 size={14} /> {t('managePersonalizedAlerts')}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* USDT P2P Spread Card */}
        <motion.div variants={itemVariants} className="bg-theme-surface border border-theme-soft rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <span className="text-yellow-400 font-black text-sm">₮</span>
            </div>
            <div>
              <h3 className="text-base font-black text-theme-primary">{t('usdtSpread')}</h3>
              <p className="text-[11px] text-theme-secondary opacity-60">{t('usdtSpreadDesc')}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-secondary">{t('p2pSpreadPercent')}</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="-10"
                max="20"
                step="0.1"
                value={usdtSpread}
                onChange={e => setUsdtSpread(parseFloat(e.target.value) || 0)}
                className="w-20 bg-theme-bg border border-theme-soft rounded-2xl px-3 py-1.5 text-sm font-black text-yellow-400 text-center outline-none focus:border-yellow-500/50"
              />
              <span className="text-sm font-black text-theme-secondary">%</span>
            </div>
          </div>
          <p className="text-[10px] text-theme-secondary mt-2 opacity-50">{t('usdtSpreadHint')}</p>
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
              className="bg-theme-surface border border-theme-soft rounded-2xl p-6 relative overflow-hidden group shadow-lg"
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
                      onClick={async () => {
                        setIsLoadingBackups(true);
                        const backups = await listCloudBackups();
                        setCloudBackups(backups);
                        setIsLoadingBackups(false);
                      }}
                      disabled={isSyncing || isLoadingBackups}
                      className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                        (isSyncing || isLoadingBackups) ? 'bg-theme-brand/20 text-theme-brand animate-pulse' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {(isSyncing || isLoadingBackups) ? t('processing') : t('cloudImport')}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legal notices — always visible */}
        <motion.div variants={itemVariants} className="bg-theme-surface border border-theme-soft rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 pt-5 pb-3 flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-theme-secondary opacity-50" />
            <span className="text-[10px] font-black text-theme-secondary uppercase tracking-widest opacity-50">{t('legalNotices')}</span>
          </div>
          <button
            onClick={() => setShowTerms(true)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 active:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-theme-brand/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-theme-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-theme-primary">{t('termsAndConditions')}</p>
                <p className="text-[10px] text-theme-secondary opacity-50 mt-0.5">{t('termsSubtitle')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-theme-secondary opacity-30 flex-shrink-0" />
          </button>
          <button
            onClick={() => setShowPrivacy(true)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 active:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-theme-primary">{t('privacyPolicy')}</p>
                <p className="text-[10px] text-theme-secondary opacity-50 mt-0.5">{t('privacySubtitle')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-theme-secondary opacity-30 flex-shrink-0" />
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center py-8 opacity-40">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-theme-brand animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-primary">Parity Intelligence</span>
          </div>
          <p
            onClick={onDevModeTrigger}
            className="text-[10px] font-mono cursor-pointer hover:text-theme-brand transition-colors select-none"
          >
            v2.0.0 {isDevMode && !profile.hideDevMode && t('dev_mode_label')}
          </p>
        </motion.div>
      </div>

      {/* New Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-2xl p-8 shadow-2xl"
           >
              <h3 className="text-xl font-black text-theme-primary mb-2">{t('newProfile')}</h3>
              <p className="text-xs text-theme-secondary opacity-60 mb-6">{t('newProfileDesc')}</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-2 block opacity-60">{t('profileName')}</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder={t('profiles')}
                    className="w-full bg-theme-bg border border-theme-soft rounded-2xl p-4 text-theme-primary font-bold outline-none focus:border-theme-brand transition-all"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                        setShowCreateModal(false);
                        setNewProfileName('');
                    }}
                    className="flex-1 py-4 rounded-2xl bg-theme-bg text-theme-secondary font-bold hover:bg-theme-soft transition-colors text-xs uppercase"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={() => {
                        if (newProfileName.trim()) {
                            onCreateProfile(newProfileName.trim());
                            setShowCreateModal(false);
                            setNewProfileName('');
                        }
                    }}
                    className="flex-1 py-4 rounded-2xl bg-theme-brand text-white font-black text-xs uppercase shadow-lg shadow-theme-brand/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    {t('create')}
                  </button>
                </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {showTerms && (
          <TermsModal language={lang} onClose={() => setShowTerms(false)} />
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <PrivacyModal language={lang} onClose={() => setShowPrivacy(false)} />
        )}
      </AnimatePresence>

      {cloudBackups !== null && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <h3 className="text-xl font-black text-theme-primary mb-4">{t('restoreData')}</h3>
            {cloudBackups.length === 0 ? (
              <p className="text-sm text-theme-secondary text-center py-8">{t('noCloudBackups')}</p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {cloudBackups.map(bkp => (
                   <button
                     key={bkp.id}
                     onClick={() => {
                        onImport(bkp.id);
                        setCloudBackups(null);
                     }}
                     className="w-full text-left p-4 rounded-2xl bg-theme-bg/50 border border-theme-soft hover:bg-theme-soft hover:border-theme-brand/50 transition-all flex flex-col gap-1"
                   >
                      <span className="text-sm font-bold text-theme-primary truncate block w-full">{bkp.name}</span>
                      <span className="text-[10px] text-theme-secondary opacity-70">
                        {new Date(bkp.modifiedTime).toLocaleString()} • {bkp.size ? (parseInt(bkp.size) / 1024).toFixed(1) + ' KB' : t('unknown')}
                      </span>
                   </button>
                ))}
              </div>
            )}
            <button 
                onClick={() => setCloudBackups(null)}
                className="mt-6 w-full py-4 rounded-2xl bg-white/5 text-theme-secondary font-bold hover:bg-white/10 transition-colors"
            >
                {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
