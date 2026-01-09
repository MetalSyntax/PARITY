import React, { useState } from 'react';
import { X, Globe, TrendingUp, Lock, RefreshCw, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsModalProps {
  currentRate: number;
  onClose: () => void;
  onUpdateRate: (newRate: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRate, onClose, onUpdateRate }) => {
  const [rate, setRate] = useState(currentRate);
  const [mode, setMode] = useState<'AUTO' | 'PARALLEL' | 'MANUAL'>('MANUAL');
  const { currentTheme, setTheme, availableThemes } = useTheme();

  // PIN State
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleChangePin = () => {
      const currentStored = localStorage.getItem('dualflow_pin') || '0000';
      if (oldPin !== currentStored) {
          alert('Incorrect current PIN');
          return;
      }
      if (newPin.length !== 4 || isNaN(Number(newPin))) {
          alert('New PIN must be 4 digits');
          return;
      }
      localStorage.setItem('dualflow_pin', newPin);
      setShowPinChange(false);
      setOldPin('');
      setNewPin('');
      alert('PIN updated successfully');
  };

  const handleSave = () => {
    onUpdateRate(rate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-theme-surface w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-theme-primary">Settings</h2>
          <button onClick={onClose}><X size={20} className="text-theme-secondary" /></button>
        </div>

        <div className="p-6 h-[60vh] overflow-y-auto no-scrollbar">
          
          {/* Theme Section */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-theme-secondary uppercase mb-4 flex items-center gap-2">
                <Palette size={14}/> Appearance
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
            <TrendingUp size={14}/> Exchange Rate
          </h3>
          <p className="text-xs text-theme-secondary mb-4">Select the source for the conversion rate applied to your USD balance visualization.</p>
          
          <div className="flex flex-col gap-3 mb-6">
             <button disabled className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all opacity-50 cursor-not-allowed bg-white/5 border-transparent`}>
                <div className="w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center"><Globe size={20} className="text-theme-secondary" /></div>
                <div>
                   <p className="font-bold text-sm text-theme-secondary">Official Bank Rate</p>
                   <p className="text-xs text-theme-secondary">Temporarily Disabled</p>
                </div>
             </button>
             
             <button disabled className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all opacity-50 cursor-not-allowed bg-white/5 border-transparent`}>
                <div className="w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center"><TrendingUp size={20} className="text-theme-secondary" /></div>
                <div>
                   <p className="font-bold text-sm text-theme-secondary">Parallel Market</p>
                   <p className="text-xs text-theme-secondary">Temporarily Disabled</p>
                </div>
             </button>

             <button onClick={() => setMode('MANUAL')} className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${mode === 'MANUAL' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-transparent'}`}>
                <div className="w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center"><Lock size={20} className="text-purple-400" /></div>
                <div>
                   <p className="font-bold text-sm text-theme-primary">Manual Control</p>
                   <p className="text-xs text-theme-secondary">Set your own fixed rate</p>
                </div>
             </button>
          </div>

          <div className="border-t border-white/5 my-6"></div>

          {/* Security Section */}
           <div className="mb-6">
             <h3 className="text-sm font-bold text-theme-secondary uppercase mb-4 flex items-center gap-2">
               <Lock size={14}/> Security
             </h3>
             
             {!showPinChange ? (
                 <button onClick={() => setShowPinChange(true)} className="w-full text-left p-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-colors flex justify-between items-center group">
                     <div>
                         <p className="font-bold text-sm text-theme-primary">Change Security PIN</p>
                         <p className="text-xs text-theme-secondary">Current PIN: ****</p>
                     </div>
                     <span className="text-xs font-bold text-theme-brand group-hover:underline">Edit</span>
                 </button>
             ) : (
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5 animate-in fade-in">
                     <p className="font-bold text-sm text-theme-primary mb-3">Update PIN</p>
                     
                     <div className="flex flex-col gap-3">
                         <input 
                            type="password" 
                            placeholder="Current PIN" 
                            maxLength={4}
                            value={oldPin}
                            onChange={(e) => setOldPin(e.target.value)}
                            className="bg-black/20 p-3 rounded-lg text-white outline-none border border-white/10 focus:border-theme-brand text-center tracking-widest"
                         />
                         <input 
                            type="password" 
                            placeholder="New PIN (4 digits)" 
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="bg-black/20 p-3 rounded-lg text-white outline-none border border-white/10 focus:border-theme-brand text-center tracking-widest"
                         />
                         <div className="flex gap-2 mt-2">
                             <button onClick={() => setShowPinChange(false)} className="flex-1 py-2 text-xs font-bold text-theme-secondary hover:text-white">Cancel</button>
                             <button onClick={handleChangePin} className="flex-1 py-2 bg-theme-brand text-white rounded-lg text-xs font-bold shadow-lg">Save PIN</button>
                         </div>
                     </div>
                 </div>
             )}
          </div>

          <div className="border-t border-white/5 my-6"></div>

          {/* Slider/Input Area */}
          <div className={`transition-all duration-300 ${mode === 'MANUAL' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             <div className="text-center mb-2">
               <span className="text-xs text-theme-secondary uppercase tracking-widest">Current Rate</span>
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
            <RefreshCw size={18} /> Update
          </button>
        </div>
      </div>
    </div>
  );
};