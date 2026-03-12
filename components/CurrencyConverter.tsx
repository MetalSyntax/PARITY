import React, { useState } from "react";
import { ArrowRightLeft, RefreshCw, Delete, X } from "lucide-react";
import { getTranslation } from "../i18n";
import { Language } from "../types";

interface CurrencyConverterProps {
  exchangeRate: number;
  lang: Language;
  onToggleBottomNav: (visible: boolean) => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  exchangeRate,
  lang,
  onToggleBottomNav
}) => {
  const [convertAmount, setConvertAmount] = useState<string>('1');
  const [convertFromTo, setConvertFromTo] = useState<'USD_TO_VES' | 'VES_TO_USD'>('USD_TO_VES');
  const [isConverterFocused, setIsConverterFocused] = useState(false);

  const t = (key: any) => getTranslation(lang, key);

  const handleAmountChange = (val: string) => {
    setConvertAmount(val.replace(/[^0-9\.]/g, ''));
  };

  const calculatedResult = () => {
    const amt = parseFloat(convertAmount) || 0;
    if (convertFromTo === 'USD_TO_VES') {
      return (amt * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else {
      return (amt / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  };

  return (
    <>
      <div className="bg-theme-surface rounded-[2rem] p-6 border border-theme-soft shadow-theme relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-theme-brand" />
            <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest">{t("currencyConverter")}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-theme-bg p-3 rounded-2xl border border-theme-soft shadow-inner">
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-theme-secondary opacity-50 ml-2 mb-1">
              {convertFromTo === 'USD_TO_VES' ? 'USD' : 'Bs.'}
            </span>
            <input 
              type="text"
              inputMode="none"
              value={convertAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onFocus={() => { setIsConverterFocused(true); onToggleBottomNav(false); }}
              className={`bg-transparent text-xl font-black outline-none px-2 w-full transition-colors ${isConverterFocused ? 'text-theme-brand' : 'text-theme-primary'}`}
            />
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); setConvertFromTo(prev => prev === 'USD_TO_VES' ? 'VES_TO_USD' : 'USD_TO_VES'); }}
            className="p-3 bg-theme-surface border border-theme-soft shadow-sm rounded-xl text-theme-brand hover:scale-105 active:scale-95 transition-all"
          >
            <RefreshCw size={18} />
          </button>
          
          <div className="flex-1 flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-theme-secondary opacity-50 mr-2 mb-1">
              {convertFromTo === 'USD_TO_VES' ? 'Bs.' : 'USD'}
            </span>
            <p className="text-xl font-black text-theme-primary px-2 break-all line-clamp-1 truncate w-full text-right overflow-hidden">
              {calculatedResult()}
            </p>
          </div>
        </div>
      </div>

      {isConverterFocused && (
        <div className="fixed inset-x-0 bottom-0 bg-theme-surface border-t border-theme-soft p-6 z-[80] animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-black text-theme-secondary uppercase tracking-widest">{t('converterKeypad')}</h4>
            <button 
              onClick={() => { setIsConverterFocused(false); onToggleBottomNav(true); }}
              className="p-2 bg-theme-soft rounded-lg text-theme-secondary hover:text-theme-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-y-6 gap-x-8 max-w-md mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => setConvertAmount(prev => prev === '0' ? num.toString() : prev + num.toString())}
                className="text-2xl font-black text-theme-primary hover:text-theme-brand transition-colors py-2 active:scale-90"
              >
                {num}
              </button>
            ))}
            <button 
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setConvertAmount(prev => prev.includes('.') ? prev : prev + '.')}
              className="text-2xl font-black text-theme-primary hover:text-theme-brand transition-colors pb-2 active:scale-90"
            >
              .
            </button>
            <button 
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setConvertAmount(prev => prev === '0' ? '0' : prev + '0')}
              className="text-2xl font-black text-theme-primary hover:text-theme-brand transition-colors pb-2 active:scale-90"
            >
              0
            </button>
            <button 
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setConvertAmount(prev => prev.length <= 1 ? '0' : prev.slice(0, -1))}
              className="flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors pb-2 active:scale-90"
            >
              <Delete size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
