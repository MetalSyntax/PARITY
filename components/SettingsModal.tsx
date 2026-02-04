import React, { useState } from 'react';
import { X, Globe, TrendingUp, Lock, RefreshCw, Palette, Database, ChevronRight, Save, Download, FileSpreadsheet, Upload, Info, Layout, CheckCircle2, Cloud, Settings2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { getTranslation } from '../i18n';
import { Language } from '../types';
import { StorageType } from '../services/db';

interface SettingsModalProps {
  currentRate: number;
  onClose: () => void;
  onUpdateRate: (newRate: number) => void;
  lang: Language;
  currentStorageType: StorageType;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  autoLockEnabled: boolean;
  onToggleAutoLock: (enabled: boolean) => void;
  autoLockDelay: number;
  onSetAutoLockDelay: (delay: number) => void;
  biometricsEnabled: boolean;
  onToggleBiometrics: (enabled: boolean) => void;
  isDevMode?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRate, onClose, onUpdateRate, lang, currentStorageType, showAlert, autoLockEnabled, onToggleAutoLock, autoLockDelay, onSetAutoLockDelay, biometricsEnabled, onToggleBiometrics, isDevMode }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [rate, setRate] = useState(currentRate);
  const [mode, setMode] = useState<'AUTO' | 'PARALLEL' | 'MANUAL'>('MANUAL');
  const { currentTheme, setTheme, availableThemes } = useTheme();

  // PIN State
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  // Rate Fetching State
  const [isFetching, setIsFetching] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  React.useEffect(() => {
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(setIsBiometricSupported);
    }
  }, []);

  const handleFetchRate = async (targetMode: 'AUTO' | 'PARALLEL') => {
      setMode(targetMode);
      setIsFetching(true);
      
      try {
          const endpoint = targetMode === 'AUTO' 
              ? 'https://ve.dolarapi.com/v1/dolares/oficial' 
              : 'https://ve.dolarapi.com/v1/dolares/paralelo';
          
          const response = await fetch(endpoint);
          
          if (!response.ok) throw new Error('Network error');
          
          const data = await response.json();
          // The API returns { ..., promedio: number, ... }
          const fetchedRate = data.promedio;

          if (fetchedRate) {
              setRate(Number(fetchedRate));
          } else {
              throw new Error("Invalid format");
          }
      } catch (error) {
          console.error("Failed to fetch rate", error);
          // Fallback values if API fails
          setRate(targetMode === 'AUTO' ? 50.50 : 60.15);
          showAlert('alert_fetchError', 'error');
      } finally {
          setIsFetching(false);
      }
  };

  const handleChangePin = () => {
      const currentStored = localStorage.getItem('parity_pin') || '0000';
      if (oldPin !== currentStored) {
          showAlert('alert_incorrectPin', 'error');
          return;
      }
      if (newPin.length !== 4 || isNaN(Number(newPin))) {
          showAlert('alert_pinLengthError', 'error');
          return;
      }
      localStorage.setItem('parity_pin', newPin);
      setShowPinChange(false);
      setOldPin('');
      setNewPin('');
      showAlert('alert_pinSuccess', 'success');
  };

  const handleSave = () => {
    onUpdateRate(rate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-theme-surface w-full max-w-sm rounded-[32px] border border-theme-soft overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-theme-soft flex justify-between items-center bg-theme-surface/50">
          <h2 className="text-xl font-black text-theme-primary tracking-tight">{t('settings')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-theme-soft rounded-full transition-colors">
            <X size={20} className="text-theme-secondary" />
          </button>
        </div>

        <div className="p-6 h-[60vh] overflow-y-auto no-scrollbar space-y-8">
          
          <section>
            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60">
                <Palette size={14} className="text-theme-brand"/> {t('appearance')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {availableThemes.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id as any)}
                        className={`p-3 rounded-2xl border text-xs font-black transition-all ${currentTheme === theme.id ? 'bg-theme-brand border-theme-soft text-white shadow-lg shadow-theme-brand/20' : 'bg-theme-bg border-theme-soft text-theme-secondary hover:bg-theme-soft'}`}
                    >
                        {theme.name}
                    </button>
                ))}
            </div>
          </section>

          <div className="h-px bg-theme-soft"></div>

          <section>
            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60">
              <TrendingUp size={14} className="text-theme-brand"/> {t('exchangeRateLabel')}
            </h3>
            <p className="text-[11px] font-bold text-theme-secondary mb-5 leading-relaxed opacity-80">{t('rateSourceDescription')}</p>
            
            <div className="flex flex-col gap-3">
               <button 
                   onClick={() => handleFetchRate('AUTO')}
                   className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${mode === 'AUTO' ? 'bg-theme-brand/5 border-theme-soft ring-1 ring-theme-brand/20' : 'bg-theme-bg border-theme-soft hover:bg-theme-soft'}`}
               >
                  <div className="w-12 h-12 rounded-2xl bg-theme-surface flex items-center justify-center shadow-sm border border-theme-soft"><Globe size={22} className="text-emerald-500" /></div>
                  <div>
                     <p className="font-black text-sm text-theme-primary">{t('officialRate')}</p>
                     <p className="text-[10px] font-bold text-theme-secondary opacity-60">{isFetching && mode === 'AUTO' ? t('fetching') : 'BCV'}</p>
                  </div>
               </button>
               
               {isDevMode && (
                <div className="relative group">
                  <div className="absolute -top-2 right-4 px-2 py-0.5 bg-theme-brand text-[8px] font-black text-white uppercase tracking-widest rounded-full z-10 shadow-sm border border-theme-soft">
                      {t('experimental')}
                  </div>
                  <button 
                      onClick={() => handleFetchRate('PARALLEL')}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${mode === 'PARALLEL' ? 'bg-amber-500/5 border-amber-500/40 ring-1 ring-amber-500/20' : 'bg-theme-bg border-theme-soft hover:bg-theme-soft'}`}
                  >
                      <div className="w-12 h-12 rounded-2xl bg-theme-surface flex items-center justify-center shadow-sm border border-theme-soft"><TrendingUp size={22} className="text-amber-500" /></div>
                      <div>
                        <p className="font-black text-sm text-theme-primary">{t('parallelRate')}</p>
                        <p className="text-[10px] font-bold text-theme-secondary opacity-60">{isFetching && mode === 'PARALLEL' ? t('fetching') : t('averageParallel')}</p>
                      </div>
                  </button>
                </div>
               )}

               <button 
                  onClick={() => setMode('MANUAL')} 
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${mode === 'MANUAL' ? 'bg-theme-brand/5 border-theme-soft ring-1 ring-theme-brand/20' : 'bg-theme-bg border-theme-soft hover:bg-theme-soft'}`}
               >
                  <div className="w-12 h-12 rounded-2xl bg-theme-surface flex items-center justify-center shadow-sm border border-theme-soft"><Lock size={22} className="text-purple-500" /></div>
                  <div>
                     <p className="font-black text-sm text-theme-primary">{t('manualRate')}</p>
                     <p className="text-[10px] font-bold text-theme-secondary opacity-60">{t('setFixedRate')}</p>
                  </div>
               </button>
            </div>
          </section>

          <div className="h-px bg-theme-soft"></div>

          <section>
             <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-60">
               <Lock size={14} className="text-theme-brand"/> {t('security')}
             </h3>
             
             {!showPinChange ? (
                  <div className="space-y-3">
                      <button onClick={() => setShowPinChange(true)} className="w-full text-left p-4 bg-theme-bg border border-theme-soft hover:border-theme-soft/30 rounded-2xl transition-all flex justify-between items-center group shadow-sm">
                          <div>
                              <p className="font-black text-sm text-theme-primary">{t('changePin')}</p>
                              <p className="text-[10px] font-bold text-theme-secondary opacity-60">{t('currentPinLabel')}</p>
                          </div>
                          <ChevronRight size={16} className="text-theme-brand group-hover:translate-x-1 transition-transform" />
                      </button>

                      <div className="w-full p-4 bg-theme-bg border border-theme-soft rounded-2xl transition-all shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                              <div className="flex-1">
                                  <p className="font-black text-sm text-theme-primary">{t('autoLock')}</p>
                                  <p className="text-[10px] font-bold leading-tight text-theme-secondary opacity-50 mt-1">{t('autoLockDesc')}</p>
                              </div>
                              <button
                                onClick={() => onToggleAutoLock(!autoLockEnabled)}
                                className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${autoLockEnabled ? "bg-theme-brand shadow-lg shadow-theme-brand/20" : "bg-theme-soft"}`}
                              >
                                <div
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${autoLockEnabled ? "left-7" : "left-1"}`}
                                />
                              </button>
                          </div>
                          
                          {autoLockEnabled && (
                              <div className="pt-4 border-t border-theme-soft">
                                  <p className="text-[9px] font-black text-theme-secondary uppercase mb-3 tracking-[0.15em] opacity-40">{t('autoLockDelay')}</p>
                                  <div className="grid grid-cols-4 gap-2">
                                      {[0, 60, 300, 900].map((delay) => (
                                          <button
                                              key={delay}
                                              onClick={() => onSetAutoLockDelay(delay)}
                                              className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all border ${autoLockDelay === delay ? 'bg-theme-brand border-theme-soft text-white shadow-md' : 'bg-theme-surface border-theme-soft text-theme-secondary opacity-60'}`}
                                          >
                                              {delay === 0 ? t('delayImmediately') : 
                                               delay === 60 ? '1m' : 
                                               delay === 300 ? '5m' : '15m'}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="w-full p-4 bg-theme-bg border border-theme-soft rounded-2xl transition-all shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-sm text-theme-primary">{t('biometrics')}</p>
                                    {!isBiometricSupported && <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-black uppercase">{t('notSupported')}</span>}
                                  </div>
                                  <p className="text-[10px] font-bold leading-tight text-theme-secondary opacity-50 mt-1">{t('biometricsDesc')}</p>
                              </div>
                              <button
                                onClick={() => {
                                    if (!isBiometricSupported && !biometricsEnabled) {
                                        showAlert('biometricsNotSupported', 'error');
                                        return;
                                    }
                                    onToggleBiometrics(!biometricsEnabled);
                                }}
                                className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${biometricsEnabled ? "bg-theme-brand shadow-lg shadow-theme-brand/20" : "bg-theme-soft"}`}
                              >
                                <div
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${biometricsEnabled ? "left-7" : "left-1"}`}
                                />
                              </button>
                          </div>
                      </div>
                  </div>
             ) : (
                  <div className="bg-theme-bg p-5 rounded-2xl border border-theme-soft/30 animate-in fade-in slide-in-from-top-2 shadow-xl">
                      <p className="font-black text-sm text-theme-primary mb-4">{t('updatePin')}</p>
                      
                      <div className="flex flex-col gap-3">
                          <input 
                             type="password" 
                             placeholder={t('currentPinPlaceholder')}
                             maxLength={4}
                             value={oldPin}
                             onChange={(e) => setOldPin(e.target.value)}
                             className="bg-theme-surface p-4 rounded-xl text-theme-primary outline-none border border-theme-soft focus:border-theme-soft text-center tracking-[0.5em] font-black text-xl shadow-inner"
                          />
                          <input 
                             type="password" 
                             placeholder={t('newPinPlaceholder')}
                             maxLength={4}
                             value={newPin}
                             onChange={(e) => setNewPin(e.target.value)}
                             className="bg-theme-surface p-4 rounded-xl text-theme-primary outline-none border border-theme-soft focus:border-theme-soft text-center tracking-[0.5em] font-black text-xl shadow-inner"
                          />
                          <div className="flex gap-2 mt-4">
                              <button onClick={() => setShowPinChange(false)} className="flex-1 py-3 text-xs font-black text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest">{t('cancel')}</button>
                              <button onClick={handleChangePin} className="flex-1 py-3 bg-theme-brand text-white rounded-xl text-xs font-black shadow-lg shadow-theme-brand/30 uppercase tracking-widest">{t('savePin')}</button>
                          </div>
                      </div>
                  </div>
             )}
          </section>

          <div className="h-px bg-theme-soft"></div>

          {/* Rate Control Area */}
          <div className={`transition-all duration-300 ${mode === 'MANUAL' ? 'scale-100' : 'scale-95 opacity-50 pointer-events-none'}`}>
             <div className="text-center mb-4">
               <span className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.3em] opacity-40">{t('currentRateLabel')}</span>
             </div>
             <div className="flex items-center justify-between gap-4 bg-theme-bg p-3 rounded-[28px] border border-theme-soft shadow-inner">
               <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRate(r => Number((r - 0.1).toFixed(2)))} 
                  className="w-14 h-14 rounded-2xl bg-theme-surface border border-theme-soft shadow-sm hover:bg-theme-soft flex items-center justify-center text-xl font-black transition-all text-theme-primary"
               >-</motion.button>
               
               <div className="flex flex-col items-center flex-1">
                 <input 
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="text-3xl font-black text-theme-primary bg-transparent text-center w-full outline-none focus:text-theme-brand transition-colors tracking-tighter"
                 />
                 <span className="text-[9px] font-black text-theme-secondary opacity-40 uppercase tracking-[0.2em] -mt-1">Bs. / USD</span>
               </div>
               
               <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRate(r => Number((r + 0.1).toFixed(2)))} 
                  className="w-14 h-14 rounded-2xl bg-theme-surface border border-theme-soft shadow-sm hover:bg-theme-soft flex items-center justify-center text-xl font-black transition-all text-theme-primary"
               >+</motion.button>
             </div>
          </div>
        </div>

        <div className="p-6 pt-2">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full bg-theme-primary text-theme-bg font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            <Save size={18} /> {t('update')}
          </motion.button>
        </div>
      </div>
    </div>
  );
};