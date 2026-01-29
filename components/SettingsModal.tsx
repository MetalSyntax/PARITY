import React, { useState } from 'react';
import { X, Globe, TrendingUp, Lock, RefreshCw, Palette, Database } from 'lucide-react';
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
  onToggleAutoLock: (enabled: boolean) => void;
  autoLockDelay: number;
  onSetAutoLockDelay: (delay: number) => void;
  isDevMode?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRate, onClose, onUpdateRate, lang, currentStorageType, showAlert, autoLockEnabled, onToggleAutoLock, autoLockDelay, onSetAutoLockDelay, isDevMode }) => {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-theme-surface w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-theme-primary">{t('settings')}</h2>
          <button onClick={onClose}><X size={20} className="text-theme-secondary" /></button>
        </div>

        <div className="p-6 h-[60vh] overflow-y-auto no-scrollbar">
          
          <div className="mb-8">
            <h3 className="text-sm font-bold text-theme-secondary uppercase mb-4 flex items-center gap-2">
                <Palette size={14}/> {t('appearance')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {availableThemes.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id as any)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${currentTheme === theme.id ? 'bg-theme-brand border-transparent text-white' : 'bg-white/5 border-white/5 text-theme-secondary hover:bg-white/10'}`}
                    >
                        {theme.name}
                    </button>
                ))}
            </div>
          </div>

          <div className="border-t border-white/5 my-6"></div>

          <h3 className="text-sm font-bold text-theme-secondary uppercase mb-4 flex items-center gap-2">
            <TrendingUp size={14}/> {t('exchangeRateLabel')}
          </h3>
          <p className="text-xs text-theme-secondary mb-4">{t('rateSourceDescription')}</p>
          
          <div className="flex flex-col gap-3 mb-6">
             <button 
                 onClick={() => handleFetchRate('AUTO')}
                 className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${mode === 'AUTO' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
             >
                <div className="w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center"><Globe size={20} className="text-emerald-400" /></div>
                <div>
                   <p className="font-bold text-sm text-theme-primary">{t('officialRate')}</p>
                   <p className="text-xs text-theme-secondary">{isFetching && mode === 'AUTO' ? t('fetching') : 'Banco Central de Venezuela'}</p>
                </div>
             </button>
             
             {isDevMode && (
              <div className="bg-theme-surface border border-theme-brand/30 rounded-2xl p-0 relative overflow-hidden ring-1 ring-theme-brand/20">
              <div className="absolute top-0 right-0 px-3 py-1 bg-theme-brand text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl">
                  {t('experimentalFeature')}
              </div>
               <button 
                  onClick={() => handleFetchRate('PARALLEL')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${mode === 'PARALLEL' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
               >
                  <div className="w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center"><TrendingUp size={20} className="text-amber-400" /></div>
                  <div>
                    <p className="font-bold text-sm text-theme-primary">{t('parallelRate')}</p>
                    <p className="text-xs text-theme-secondary">{isFetching && mode === 'PARALLEL' ? t('fetching') : t('averageParallel')}</p>
                  </div>
               </button>
                </div>
             )}

             <button onClick={() => setMode('MANUAL')} className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${mode === 'MANUAL' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-transparent'}`}>
                <div className="w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center"><Lock size={20} className="text-purple-400" /></div>
                <div>
                   <p className="font-bold text-sm text-theme-primary">{t('manualRate')}</p>
                   <p className="text-xs text-theme-secondary">{t('setFixedRate')}</p>
                </div>
             </button>
          </div>



          <div className="border-t border-white/5 my-6"></div>

          {/* Security Section */}
           <div className="mb-6">
             <h3 className="text-sm font-bold text-theme-secondary uppercase mb-4 flex items-center gap-2">
               <Lock size={14}/> {t('security')}
             </h3>
             
             {!showPinChange ? (
                  <div className="space-y-3">
                      <button onClick={() => setShowPinChange(true)} className="w-full text-left p-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-colors flex justify-between items-center group">
                          <div>
                              <p className="font-bold text-sm text-theme-primary">{t('changePin')}</p>
                              <p className="text-xs text-theme-secondary">{t('currentPinLabel')}</p>
                          </div>
                          <span className="text-xs font-bold text-theme-brand group-hover:underline">{t('edit')}</span>
                      </button>

                      <div className="w-full p-4 bg-white/5 border border-white/5 rounded-xl transition-colors">
                          <div className="flex justify-between items-center mb-4">
                              <div className="flex-1">
                                  <p className="font-bold text-sm text-theme-primary">{t('autoLock')}</p>
                                  <p className="text-[10px] leading-tight text-theme-secondary opacity-70 mt-1">{t('autoLockDesc')}</p>
                              </div>
                              <button
                                onClick={() => onToggleAutoLock(!autoLockEnabled)}
                                className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${autoLockEnabled ? "bg-theme-brand" : "bg-white/10"}`}
                              >
                                <div
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoLockEnabled ? "left-7" : "left-1"}`}
                                />
                              </button>
                          </div>
                          
                          {autoLockEnabled && (
                              <div className="pt-4 border-t border-white/5">
                                  <p className="text-[10px] font-bold text-theme-secondary uppercase mb-3 tracking-wider">{t('autoLockDelay')}</p>
                                  <div className="grid grid-cols-4 gap-2">
                                      {[0, 60, 300, 900].map((delay) => (
                                          <button
                                              key={delay}
                                              onClick={() => onSetAutoLockDelay(delay)}
                                              className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${autoLockDelay === delay ? 'bg-theme-brand border-transparent text-white' : 'bg-black/20 border-white/5 text-theme-secondary'}`}
                                          >
                                              {delay === 0 ? t('delayImmediately') : 
                                               delay === 60 ? t('delay1Min') : 
                                               delay === 300 ? t('delay5Min') : t('delay15Min')}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
             ) : (
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5 animate-in fade-in">
                     <p className="font-bold text-sm text-theme-primary mb-3">{t('updatePin')}</p>
                     
                     <div className="flex flex-col gap-3">
                         <input 
                            type="password" 
                            placeholder={t('currentPinPlaceholder')}
                            maxLength={4}
                            value={oldPin}
                            onChange={(e) => setOldPin(e.target.value)}
                            className="bg-black/20 p-3 rounded-lg text-white outline-none border border-white/10 focus:border-theme-brand text-center tracking-widest"
                         />
                         <input 
                            type="password" 
                            placeholder={t('newPinPlaceholder')}
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="bg-black/20 p-3 rounded-lg text-white outline-none border border-white/10 focus:border-theme-brand text-center tracking-widest"
                         />
                         <div className="flex gap-2 mt-2">
                             <button onClick={() => setShowPinChange(false)} className="flex-1 py-2 text-xs font-bold text-theme-secondary hover:text-white">{t('cancel')}</button>
                             <button onClick={handleChangePin} className="flex-1 py-2 bg-theme-brand text-white rounded-lg text-xs font-bold shadow-lg">{t('savePin')}</button>
                         </div>
                     </div>
                 </div>
             )}
          </div>

          <div className="border-t border-white/5 my-6"></div>

          {/* Slider/Input Area */}
          <div className={`transition-all duration-300 ${mode === 'MANUAL' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             <div className="text-center mb-2">
               <span className="text-xs text-theme-secondary uppercase tracking-widest">{t('currentRateLabel')}</span>
             </div>
             <div className="flex items-center justify-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
               <button onClick={() => setRate(r => Number((r - 0.1).toFixed(2)))} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl font-bold transition-colors text-theme-primary">-</button>
               <div className="flex flex-col items-center flex-1">
                 <input 
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="text-3xl font-mono font-bold text-theme-primary bg-transparent text-center w-full outline-none focus:text-indigo-400 transition-colors"
                 />
                 <span className="text-xs text-theme-secondary">VES / USD</span>
               </div>
               <button onClick={() => setRate(r => Number((r + 0.1).toFixed(2)))} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl font-bold transition-colors text-theme-primary">+</button>
             </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full mt-8 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> {t('update')}
          </button>
        </div>
      </div>
    </div>
  );
};