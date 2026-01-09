import React, { useState } from 'react';
import { X, Globe, TrendingUp, Lock, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  currentRate: number;
  onClose: () => void;
  onUpdateRate: (newRate: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentRate, onClose, onUpdateRate }) => {
  const [rate, setRate] = useState(currentRate);
  const [mode, setMode] = useState<'AUTO' | 'PARALLEL' | 'MANUAL'>('MANUAL');

  const handleSave = () => {
    onUpdateRate(rate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold">Exchange Rate</h2>
          <button onClick={onClose}><X size={20} className="text-zinc-500" /></button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-400 mb-4">Select the source for the conversion rate applied to your USD balance visualization.</p>
          
          <div className="flex flex-col gap-3 mb-6">
             <button disabled className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all opacity-50 cursor-not-allowed bg-white/5 border-transparent`}>
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><Globe size={20} className="text-zinc-500" /></div>
                <div>
                   <p className="font-bold text-sm text-zinc-500">Official Bank Rate</p>
                   <p className="text-xs text-zinc-600">Temporarily Disabled</p>
                </div>
             </button>
             
             <button disabled className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all opacity-50 cursor-not-allowed bg-white/5 border-transparent`}>
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><TrendingUp size={20} className="text-zinc-500" /></div>
                <div>
                   <p className="font-bold text-sm text-zinc-500">Parallel Market</p>
                   <p className="text-xs text-zinc-600">Temporarily Disabled</p>
                </div>
             </button>

             <button onClick={() => setMode('MANUAL')} className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${mode === 'MANUAL' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-transparent'}`}>
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><Lock size={20} className="text-purple-400" /></div>
                <div>
                   <p className="font-bold text-sm">Manual Control</p>
                   <p className="text-xs text-zinc-500">Set your own fixed rate</p>
                </div>
             </button>
          </div>

          {/* Slider/Input Area */}
          <div className={`transition-all duration-300 ${mode === 'MANUAL' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             <div className="text-center mb-2">
               <span className="text-xs text-zinc-500 uppercase tracking-widest">Current Rate</span>
             </div>
             <div className="flex items-center justify-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
               <button onClick={() => setRate(r => Number((r - 0.1).toFixed(2)))} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl font-bold transition-colors">-</button>
               <div className="flex flex-col items-center flex-1">
                 <input 
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="text-3xl font-mono font-bold text-white bg-transparent text-center w-full outline-none focus:text-indigo-400 transition-colors"
                 />
                 <span className="text-xs text-zinc-500">VES / USD</span>
               </div>
               <button onClick={() => setRate(r => Number((r + 0.1).toFixed(2)))} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl font-bold transition-colors">+</button>
             </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full mt-8 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Update Rate
          </button>
        </div>
      </div>
    </div>
  );
};