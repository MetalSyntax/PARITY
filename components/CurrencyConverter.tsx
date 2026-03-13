import React, { useState } from "react";
import { ArrowRightLeft, RefreshCw, Delete, X } from "lucide-react";
import { getTranslation } from "../i18n";
import { Language, Currency } from "../types";

interface CurrencyConverterProps {
  exchangeRate: number;
  euroRate?: number;
  lang: Language;
  onToggleBottomNav: (visible: boolean) => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  exchangeRate,
  euroRate,
  lang,
  onToggleBottomNav
}) => {
  const [convertAmount, setConvertAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<Currency>(Currency.USD);
  const [toCurrency, setToCurrency] = useState<Currency>(Currency.VES);
  const [isConverterFocused, setIsConverterFocused] = useState(false);

  const t = (key: any) => getTranslation(lang, key);

  const handleAmountChange = (val: string) => {
    setConvertAmount(val.replace(/[^0-9\.]/g, ''));
  };

  const calculatedResult = () => {
    const amt = parseFloat(convertAmount) || 0;
    const eRate = euroRate || 1;
    let result = amt;

    // Convert from source to VES first
    let inVES = amt;
    if (fromCurrency === Currency.USD || fromCurrency === Currency.USDT) inVES = amt * exchangeRate;
    else if (fromCurrency === Currency.EUR) inVES = amt * eRate;
    
    // Convert from VES to target
    if (toCurrency === Currency.USD || toCurrency === Currency.USDT) result = inVES / exchangeRate;
    else if (toCurrency === Currency.EUR) result = inVES / eRate;
    else result = inVES;

    return result.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const cycleCurrency = (cur: Currency): Currency => {
    const rotation = [Currency.USD, Currency.VES, Currency.EUR];
    const idx = rotation.indexOf(cur as any);
    return rotation[(idx + 1) % rotation.length] as Currency;
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
          <button 
            onClick={() => setFromCurrency(cycleCurrency(fromCurrency))}
            className="flex-1 flex flex-col items-start hover:bg-white/5 p-2 rounded-xl transition-colors"
          >
            <span className="text-[10px] uppercase font-bold text-theme-brand mb-1">
              {fromCurrency}
            </span>
            <input 
              type="text"
              inputMode="none"
              value={convertAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onFocus={() => { setIsConverterFocused(true); onToggleBottomNav(false); }}
              readOnly
              className={`bg-transparent text-xl font-black outline-none w-full transition-colors cursor-pointer ${isConverterFocused ? 'text-theme-brand' : 'text-theme-primary'}`}
            />
          </button>

          <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                const oldFrom = fromCurrency;
                setFromCurrency(toCurrency);
                setToCurrency(oldFrom);
            }}
            className="p-3 bg-theme-surface border border-theme-soft shadow-sm rounded-xl text-theme-brand hover:scale-105 active:scale-95 transition-all"
          >
            <RefreshCw size={18} />
          </button>
          
          <button 
            onClick={() => setToCurrency(cycleCurrency(toCurrency))}
            className="flex-1 flex flex-col items-end hover:bg-white/5 p-2 rounded-xl transition-colors"
          >
            <span className="text-[10px] uppercase font-bold text-theme-brand mb-1">
              {toCurrency}
            </span>
            <p className="text-xl font-black text-theme-primary break-all line-clamp-1 truncate w-full text-right overflow-hidden">
              {calculatedResult()}
            </p>
          </button>
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
