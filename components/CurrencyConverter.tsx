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
  const [convertAmount, setConvertAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<Currency>(Currency.USD);
  const [toCurrency, setToCurrency] = useState<Currency>(Currency.VES);
  const [isConverterFocused, setIsConverterFocused] = useState(false);

  const t = (key: any) => getTranslation(lang, key);

  const handleAmountChange = (val: string) => {
    setConvertAmount(val.replace(/[^0-9\.]/g, ''));
  };

  const calculatedResult = () => {
    const amt = convertAmount === '' ? 1 : (parseFloat(convertAmount) || 0);
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
        className="bg-theme-surface rounded-[2.5rem] p-4 border border-theme-soft shadow-theme relative overflow-hidden group"
      >
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-theme-brand/5 blur-3xl rounded-full" />
        
        <div className="flex justify-between items-center mb-2 relative z-10">
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
        
        <div className="flex flex-col gap-3 relative z-10">
          {/* FROM ROW */}
          <div className="relative">
            <motion.button 
              whileTap={{ scale: 0.99 }}
              onClick={() => { setIsConverterFocused(true); onToggleBottomNav(false); }}
              className={`w-full flex flex-col items-start bg-theme-bg/40 p-2 rounded-[2rem] transition-all hover:bg-theme-bg/60 group/input`}
            >
              <div className="w-full flex justify-between items-center mb-3">
                 <span className="text-[10px] font-black text-theme-secondary/60 uppercase tracking-widest">{t('amountToConvert') || 'Monto a convertir'}</span>
                 <div 
                    onClick={(e) => { e.stopPropagation(); cycleCurrency(fromCurrency, true); }}
                    className="flex items-center gap-2 bg-theme-surface/50 border border-white/5 py-1.5 px-3 rounded-xl hover:bg-white/10 transition-colors"
                 >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${fromCurrency === Currency.VES ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'} border border-current shadow-sm`}>
                       {fromCurrency === Currency.USD ? <DollarSign size={10} /> : fromCurrency === Currency.VES ? <span className="text-[8px] font-black">Bs</span> : <Euro size={10} />}
                    </div>
                    <span className="text-xs font-black text-theme-primary tracking-tight">{fromCurrency}</span>
                 </div>
              </div>
              <div className={`text-xl font-black transition-all duration-300 ${isConverterFocused ? 'text-theme-brand' : (!convertAmount ? 'text-theme-secondary opacity-40' : 'text-theme-primary')}`}>
                 {convertAmount || '1'}
              </div>
            </motion.button>

            {/* SWAP BUTTON */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-20">
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    const oldFrom = fromCurrency;
                    setFromCurrency(toCurrency);
                    setToCurrency(oldFrom);
                }}
                className="w-10 h-10 bg-theme-surface border-2 border-theme-soft shadow-xl rounded-2xl text-theme-brand flex items-center justify-center transition-all"
              >
                <RefreshCw size={18} />
              </motion.button>
            </div>
          </div>

          {/* TO ROW */}
          <motion.button 
            whileTap={{ scale: 0.99 }}
            onClick={() => cycleCurrency(toCurrency, false)}
            className="w-full flex flex-col items-start bg-theme-bg/40 p-2 transition-all hover:bg-theme-bg/60 group/input"
          >
            <div className="w-full flex justify-between items-center mb-3">
               <span className="text-[10px] font-black text-theme-brand uppercase tracking-widest leading-none">{t('convertedAmount') || 'Monto convertido'}</span>
               <div className="flex items-center gap-2 bg-theme-surface/50 border border-white/5 py-1.5 px-3 rounded-xl hover:bg-white/10 transition-colors">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${toCurrency === Currency.VES ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'} border border-current shadow-sm`}>
                     {toCurrency === Currency.USD ? <DollarSign size={10} /> : toCurrency === Currency.VES ? <span className="text-[8px] font-black">Bs</span> : <Euro size={10} />}
                  </div>
                  <span className="text-xs font-black text-theme-brand tracking-tight">{toCurrency}</span>
               </div>
            </div>
            <div className="text-xl font-black text-theme-brand break-all line-clamp-1 truncate w-full text-left overflow-hidden selection:bg-theme-brand/30">
              {calculatedResult()}
            </div>
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isConverterFocused && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsConverterFocused(false); onToggleBottomNav(true); }}
              className="fixed inset-0 z-[90]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-theme-surface/95 backdrop-blur-2xl border-t border-theme-soft p-2 z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] rounded-t-[3rem]"
            >
              <div className="max-w-md mx-auto">
                <div className="w-12 h-1.5 bg-theme-soft rounded-full mx-auto mb-3" />
                
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
                    onClick={() => setConvertAmount(prev => prev.length <= 1 ? '' : prev.slice(0, -1))}
                    className="flex items-center justify-center text-theme-secondary hover:text-rose-500 transition-all active:rose-500"
                  >
                    <Delete size={28} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
