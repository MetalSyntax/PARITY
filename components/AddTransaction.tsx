import React, { useState, useEffect } from 'react';
import { X, Delete, Check, Calculator, Mic, ChevronDown, Sparkles, ChevronRight, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionType, Currency, Account, Language } from '../types';
import { CATEGORIES, SMART_CATEGORIES } from '../constants';
import { getTranslation } from '../i18n';

interface AddTransactionProps {
  onClose: () => void;
  onSave: (data: any) => void;
  exchangeRate: number;
  accounts: Account[];
  lang: Language;
}

export const AddTransaction: React.FC<AddTransactionProps> = ({ onClose, onSave, exchangeRate, accounts, lang }) => {
  const [amountStr, setAmountStr] = useState('0');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [note, setNote] = useState('');
  
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0].id);
  const [toAccountId, setToAccountId] = useState<string>(accounts.length > 1 ? accounts[1].id : accounts[0].id);
  
  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState<'FROM' | 'TO' | null>(null);

  const t = (key: any) => getTranslation(lang, key);

  // Safe Math Evaluation
  const evaluateExpression = (expression: string): string => {
    try {
      if (/[^0-9+\-*/.]/.test(expression)) return expression;
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expression}`)();
      return isFinite(result) ? String(Math.round(result * 100) / 100) : 'Error';
    } catch {
      return 'Error';
    }
  };

  useEffect(() => {
    const lowerNote = note.toLowerCase();
    for (const key in SMART_CATEGORIES) {
      if (lowerNote.includes(key)) {
        setCategoryId(SMART_CATEGORIES[key]);
        return;
      }
    }
  }, [note]);

  const handleKeyPress = (val: string) => {
    setAmountStr(prev => {
      if (prev === '0' && val !== '.') return val;
      if (val === '.' && prev.slice(-1) === '.') return prev;
      
      const isOperator = ['+', '-', '*', '/'].includes(val);
      const lastChar = prev.slice(-1);
      const lastIsOperator = ['+', '-', '*', '/'].includes(lastChar);
      
      if (isOperator && lastIsOperator) {
         return prev.slice(0, -1) + val;
      }
      return prev + val;
    });
  };

  const handleDelete = () => {
    setAmountStr(prev => {
      if (prev.length === 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  const handleCalculate = () => {
    const result = evaluateExpression(amountStr);
    setAmountStr(result);
    setIsCalculatorMode(false);
  };

  const handleSave = () => {
    let finalAmount = parseFloat(amountStr);
    if (isNaN(finalAmount) || ['+', '-', '*', '/'].some(op => amountStr.includes(op))) {
      const resolved = evaluateExpression(amountStr);
      finalAmount = parseFloat(resolved);
    }

    if (finalAmount === 0 || isNaN(finalAmount)) return;

    onSave({
      amount: finalAmount,
      originalCurrency: currency,
      exchangeRate: exchangeRate, 
      type,
      category: categoryId,
      accountId: fromAccountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      note,
      date: new Date().toISOString(),
    });
  };

  const getActiveAccount = (id: string) => accounts.find(a => a.id === id) || accounts[0];

  return (
    <div className="fixed inset-0 bg-[#000000] z-50 flex flex-col font-sans h-[100dvh] overflow-hidden">
      {/* Account Selector Modal */}
      {showAccountSelector && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col justify-end animate-in fade-in duration-200">
              <div className="bg-[#121212] rounded-t-3xl p-6 h-[70%] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl">{t('selectAccount')}</h3>
                      <button onClick={() => setShowAccountSelector(null)} className="p-2 bg-white/10 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="grid gap-3">
                      {accounts.map(acc => (
                          <button 
                             key={acc.id}
                             onClick={() => {
                                 if (showAccountSelector === 'FROM') setFromAccountId(acc.id);
                                 else setToAccountId(acc.id);
                                 setShowAccountSelector(null);
                             }}
                             className={`p-4 rounded-xl flex items-center justify-between border ${
                                 (showAccountSelector === 'FROM' ? fromAccountId : toAccountId) === acc.id 
                                 ? 'border-indigo-500 bg-indigo-500/10' 
                                 : 'border-white/5 bg-white/5'
                             }`}
                          >
                              <div className="flex items-center gap-3">
                                  <span className="text-2xl">{acc.icon}</span>
                                  <div className="text-left">
                                      <div className="font-bold">{acc.name}</div>
                                      <div className="text-xs text-zinc-400">{acc.currency}</div>
                                  </div>
                              </div>
                              <div className="font-mono text-sm">{acc.balance.toLocaleString()}</div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-4 relative">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-zinc-300 hover:bg-white/20 transition-colors">
          <X size={20} />
        </button>
        
        {/* Type Switcher */}
        <div className="flex items-center bg-[#1a1a1a] rounded-full p-1 border border-white/5">
            {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map((tType) => (
                <button
                    key={tType}
                    onClick={() => setType(tType)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        type === tType 
                        ? (tType === TransactionType.EXPENSE ? 'bg-red-500/20 text-red-400' : tType === TransactionType.INCOME ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400') 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    {tType === TransactionType.EXPENSE ? t('expense') : tType === TransactionType.INCOME ? t('income') : t('transfer')}
                </button>
            ))}
        </div>

        <button className="p-2 bg-white/10 rounded-full text-zinc-300 hover:bg-white/20 transition-colors">
          <div className="w-5 h-5 flex items-center justify-center font-bold pb-2">...</div>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-2 pb-2 overflow-y-auto no-scrollbar">
        
        {/* Amount Display */}
        <div className="flex flex-col items-center justify-center mb-6">
           <div className="flex items-baseline justify-center gap-1">
             <span className="text-3xl text-zinc-500 font-light mb-1">{currency === Currency.USD ? '$' : 'Bs.'}</span>
             <span className="text-6xl font-bold text-white tracking-tight break-all text-center">
                {amountStr}
             </span>
           </div>
           
           <div className="mt-4 flex items-center gap-2">
             <button 
               onClick={() => setCurrency(prev => prev === Currency.USD ? Currency.VES : Currency.USD)}
               className="flex items-center gap-1 bg-[#1e293b] hover:bg-[#334155] border border-white/10 px-3 py-1.5 rounded-full transition-all"
             >
               <span className="text-sm font-bold text-indigo-400">{currency}</span>
               <ChevronDown size={14} className="text-zinc-500" />
             </button>

             {/* Account Selection UX */}
             <div className="flex items-center bg-[#1e293b] rounded-full p-1 border border-white/10">
                 <button 
                    onClick={() => setShowAccountSelector('FROM')}
                    className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5"
                 >
                     <span className="text-sm">{getActiveAccount(fromAccountId).icon}</span>
                     <span className="text-xs font-bold text-zinc-300 max-w-[60px] truncate">{getActiveAccount(fromAccountId).name}</span>
                 </button>
                 
                 {type === TransactionType.TRANSFER && (
                     <>
                        <ArrowRightLeft size={12} className="text-zinc-500 mx-1" />
                        <button 
                            onClick={() => setShowAccountSelector('TO')}
                            className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5"
                        >
                            <span className="text-sm">{getActiveAccount(toAccountId).icon}</span>
                            <span className="text-xs font-bold text-zinc-300 max-w-[60px] truncate">{getActiveAccount(toAccountId).name}</span>
                        </button>
                     </>
                 )}
             </div>
           </div>
        </div>

        {/* Input Field */}
        <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl p-1 flex items-center mb-6">
           <input 
             type="text" 
             value={note}
             onChange={(e) => setNote(e.target.value)}
             placeholder={t('notePlaceholder')}
             className="bg-transparent flex-1 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none w-full"
           />
           <button className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition-colors m-1 shadow-lg shadow-blue-900/20">
             <Mic size={18} />
           </button>
        </div>

        {/* Categories Carousel */}
        {type !== TransactionType.TRANSFER && (
        <div className="mb-4">
           <div className="flex items-center justify-between mb-3">
             <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
               {t('smartCategories')}
             </span>
             <button onClick={() => setShowAllCategories(!showAllCategories)} className="text-xs text-indigo-400 font-bold flex items-center">
                 {showAllCategories ? t('viewLess') : t('viewMore')} <ChevronRight size={12} className={`transition-transform ${showAllCategories ? 'rotate-90' : ''}`} />
             </button>
           </div>
           
           {showAllCategories ? (
               <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-5 duration-200">
                   {CATEGORIES.map(cat => (
                        <button 
                        key={cat.id}
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                            categoryId === cat.id 
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                            : 'bg-[#0f172a] border-white/5 text-zinc-500 hover:bg-white/5'
                        }`}
                        >
                            <div className={`${categoryId === cat.id ? 'text-indigo-400' : 'text-zinc-500'}`}>
                                {cat.icon}
                            </div>
                            <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                        </button>
                    ))}
               </div>
           ) : (
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                   {CATEGORIES.map(cat => (
                        <button 
                        key={cat.id}
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-2xl border transition-all ${
                            categoryId === cat.id 
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                            : 'bg-[#1a1a1a] border-white/5 text-zinc-500 hover:bg-white/5'
                        }`}
                        >
                            <div className={`${categoryId === cat.id ? 'text-indigo-400' : 'text-zinc-500'} mb-1`}>
                                {cat.icon}
                            </div>
                            <span className="text-[10px] font-medium">{cat.name}</span>
                        </button>
                    ))}
               </div>
           )}
        </div>
        )}
      </div>

      {/* Keypad */}
      <div className="bg-[#000000] px-4 pb-6 pt-2 border-t border-white/5">
         {isCalculatorMode && (
           <div className="flex justify-between gap-2 mb-2 px-2">
             {['/', '*', '-', '+'].map(op => (
               <button 
                  key={op}
                  onClick={() => handleKeyPress(op)}
                  className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 py-2 rounded-lg font-bold"
               >
                 {op}
               </button>
             ))}
           </div>
         )}

         <div className="grid grid-cols-3 gap-y-6 gap-x-8 px-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                onClick={() => handleKeyPress(num.toString())}
                className="text-2xl font-medium text-white hover:text-indigo-400 transition-colors py-2"
              >
                {num}
              </button>
            ))}
            
            <button 
              onClick={() => handleKeyPress('.')}
              className="text-2xl font-medium text-white hover:text-indigo-400 transition-colors pb-2"
            >
              .
            </button>
            
            <button 
              onClick={() => handleKeyPress('0')}
              className="text-2xl font-medium text-white hover:text-indigo-400 transition-colors pb-2"
            >
              0
            </button>
            
            <button 
              onClick={handleDelete}
              className="flex items-center justify-center text-zinc-500 hover:text-white transition-colors pb-2"
            >
              <Delete size={24} />
            </button>
         </div>

         <div className="flex items-center gap-4 mt-6 px-2">
            <button 
              onClick={() => setIsCalculatorMode(!isCalculatorMode)}
              className={`p-4 rounded-2xl transition-colors ${isCalculatorMode ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              <Calculator size={24} />
            </button>
            
            <button 
              onClick={isCalculatorMode ? handleCalculate : handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold h-14 rounded-2xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all"
            >
               {isCalculatorMode ? (
                 <span>=</span>
               ) : (
                 <>
                   <span>{t('save')} {type === TransactionType.EXPENSE ? t('expense') : type === TransactionType.INCOME ? t('income') : t('transfer')}</span>
                   <Check size={18} />
                 </>
               )}
            </button>
         </div>
      </div>
    </div>
  );
};