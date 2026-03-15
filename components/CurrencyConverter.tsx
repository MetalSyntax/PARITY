import React, { useState } from "react";
import { ArrowRightLeft, RefreshCw, Delete, X, TrendingUp, DollarSign, Coins, TrendingDown, Euro } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  const cycleCurrency = (current: Currency, isFrom: boolean): void => {
    if (isFrom) {
      // Toggle 'from' between USD, VES, EUR
      const next = current === Currency.USD ? Currency.VES : current === Currency.VES ? Currency.EUR : Currency.USD;
      setFromCurrency(next);

      // Enforce rules on 'to'
      if (next === Currency.USD || next === Currency.EUR) {
        setToCurrency(Currency.VES);
      } else if (next === Currency.VES) {
        // If we switched to VES from something else, keep toCurrency as USD or EUR
        // It's likely already USD or EUR, but just in case:
        if (toCurrency === Currency.VES) setToCurrency(Currency.USD);
      }
    } else {
      // Toggle 'to'
      if (fromCurrency === Currency.VES) {
        // If 'from' is VES, 'to' can be USD or EUR
        setToCurrency(toCurrency === Currency.USD ? Currency.EUR : Currency.USD);
      } else {
        // If 'from' is foreign (USD/EUR), 'to' MUST be VES
        setToCurrency(Currency.VES);
      }
    }
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-theme-surface rounded-[2.5rem] p-7 border border-theme-soft shadow-theme relative overflow-hidden group"
      >
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-theme-brand/5 blur-3xl rounded-full" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-theme-brand/10 flex items-center justify-center text-theme-brand border-theme-brand/20 shadow-inner">
               <ArrowRightLeft size={18} />
            </div>
            <div>
               <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest leading-none mb-1">{t("currencyConverter")}</h3>
               <p className="text-[9px] font-bold text-theme-secondary/60 uppercase tracking-tighter">{t('marketAnalysis')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
             <TrendingUp size={10} className="text-emerald-500" />
             <span className="text-[9px] font-black text-emerald-500 uppercase">Live</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex-1">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => cycleCurrency(fromCurrency, true)}
              className="w-full flex flex-col items-start bg-theme-bg/50 border border-theme-soft p-4 rounded-[1.5rem] transition-all hover:bg-theme-bg hover:border-theme-soft group/input bg-theme-bg"
            >
              <div className="flex items-center gap-2 mb-2">
                 <div className={`w-5 h-5 rounded-full flex items-center justify-center ${fromCurrency === Currency.VES ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'} border border-current shadow-sm`}>
                    {fromCurrency === Currency.USD ? <DollarSign size={10} /> : fromCurrency === Currency.VES ? <span className="text-[8px] font-black">Bs</span> : <Euro size={10} />}
                 </div>
                 <span className="text-[10px] uppercase font-black text-theme-secondary">
                   {fromCurrency}
                 </span>
              </div>
              <input 
                type="text"
                inputMode="none"
                value={convertAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onFocus={() => { setIsConverterFocused(true); onToggleBottomNav(false); }}
                readOnly
                className={`bg-transparent text-2xl font-black outline-none w-full transition-colors cursor-pointer ${isConverterFocused ? 'text-theme-brand' : 'text-theme-primary'}`}
              />
            </motion.button>
          </div>

          <motion.button 
            whileHover={{ rotate: 180, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { 
                e.stopPropagation(); 
                const oldFrom = fromCurrency;
                setFromCurrency(toCurrency);
                setToCurrency(oldFrom);
            }}
            className="w-12 h-12 flex-shrink-0 bg-theme-surface border border-theme-soft shadow-lg rounded-2xl text-theme-brand flex items-center justify-center transition-all z-20"
          >
            <RefreshCw size={20} />
          </motion.button>
          
          <div className="flex-1">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => cycleCurrency(toCurrency, false)}
              className="w-full flex flex-col items-end bg-theme-bg/50 border-theme-soft/50 p-4 rounded-[1.5rem] transition-all hover:bg-theme-bg hover:border-theme-soft"
            >
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-[10px] uppercase font-black text-theme-secondary">
                   {toCurrency}
                 </span>
                 <div className={`w-5 h-5 rounded-full flex items-center justify-center ${toCurrency === Currency.VES ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'} border border-current shadow-sm`}>
                    {toCurrency === Currency.USD ? <DollarSign size={10} /> : toCurrency === Currency.VES ? <span className="text-[8px] font-black">Bs</span> : <Euro size={10} />}
                 </div>
              </div>
              <p className="text-2xl font-black text-theme-primary break-all line-clamp-1 truncate w-full text-right overflow-hidden selection:bg-theme-brand/30">
                {calculatedResult()}
              </p>
            </motion.button>
          </div>
        </div>
        
        {/* Rate context footer */}
        <div className="mt-4 flex items-center justify-between px-2">
           <div className="flex items-center gap-1 opacity-40">
              <RefreshCw size={8} className="text-theme-secondary" />
              <span className="text-[8px] font-bold text-theme-secondary uppercase">Auto-updated</span>
           </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isConverterFocused && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 bg-theme-surface/95 backdrop-blur-2xl border-t border-theme-soft p-8 pb-12 z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] rounded-t-[3rem]"
          >
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <h4 className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1">{t('converterKeypad')}</h4>
                  <div className="flex items-baseline gap-2">
                     <span className="text-2xl font-black text-theme-primary">{convertAmount}</span>
                     <span className="text-xs font-bold text-theme-brand">{fromCurrency}</span>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setIsConverterFocused(false); onToggleBottomNav(true); }}
                  className="w-12 h-12 bg-theme-soft rounded-2xl text-theme-primary flex items-center justify-center shadow-inner border border-white/5 transition-all"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <div className="grid grid-cols-3 gap-y-8 gap-x-12">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <motion.button 
                    key={num} 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => setConvertAmount(prev => prev === '0' ? num.toString() : prev + num.toString())}
                    className="text-3xl font-black text-theme-primary hover:text-theme-brand transition-all py-2"
                  >
                    {num}
                  </motion.button>
                ))}
                <motion.button 
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setConvertAmount(prev => prev.includes('.') ? prev : prev + '.')}
                  className="text-3xl font-black text-theme-secondary hover:text-theme-brand transition-all flex items-center justify-center"
                >
                  ·
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setConvertAmount(prev => prev === '0' ? '0' : prev + '0')}
                  className="text-3xl font-black text-theme-primary hover:text-theme-brand transition-all"
                >
                  0
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setConvertAmount(prev => prev.length <= 1 ? '0' : prev.slice(0, -1))}
                  className="flex items-center justify-center text-theme-secondary hover:text-rose-500 transition-all active:rose-500"
                >
                  <Delete size={28} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
