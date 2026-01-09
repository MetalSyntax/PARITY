import React, { useState, useEffect } from 'react';
import { X, Delete, Check, Calculator, Mic, ChevronDown, Sparkles, ChevronRight, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionType, Currency, Account, Language, Transaction } from '../types';
import { CATEGORIES, SMART_CATEGORIES } from '../constants';
import { getTranslation } from '../i18n';

interface AddTransactionProps {
  onClose: () => void;
  onSave: (data: any) => void;
  exchangeRate: number;
  accounts: Account[];
  lang: Language;
  initialData?: Transaction | null;
}

export const AddTransaction: React.FC<AddTransactionProps> = ({ onClose, onSave, exchangeRate, accounts, lang, initialData }) => {
  const [amountStr, setAmountStr] = useState(initialData ? initialData.amount.toString() : '0');
  const [currency, setCurrency] = useState<Currency>(initialData ? initialData.originalCurrency : Currency.USD);
  const [type, setType] = useState<TransactionType>(initialData ? initialData.type : TransactionType.EXPENSE);
  const [note, setNote] = useState(initialData ? initialData.note : '');
  
  const [fromAccountId, setFromAccountId] = useState<string>(
    initialData ? initialData.accountId : (accounts.length > 0 ? accounts[0].id : '')
  );
  const [toAccountId, setToAccountId] = useState<string>(
      initialData && initialData.toAccountId 
      ? initialData.toAccountId 
      : (accounts.length > 1 ? accounts[1].id : (accounts.length > 0 ? accounts[0].id : ''))
  );
  
  const [categoryId, setCategoryId] = useState<string>(initialData ? initialData.category : CATEGORIES[0].id);
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState<'FROM' | 'TO' | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const t = (key: any) => getTranslation(lang, key);

  const handleSpeechInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNote(prev => prev ? prev + ' ' + transcript : transcript);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  const handleReset = () => {
    setAmountStr('0');
    setNote('');
    setCategoryId(CATEGORIES[0].id);
    setShowMenu(false);
  };

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
    if (initialData) return; // Don't auto-categorize if editing
    const lowerNote = note.toLowerCase();
    for (const key in SMART_CATEGORIES) {
      if (lowerNote.includes(key)) {
        setCategoryId(SMART_CATEGORIES[key]);
        return;
      }
    }
  }, [note, initialData]);

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
      id: initialData?.id, // Pass ID if editing
      amount: finalAmount,
      originalCurrency: currency,
      exchangeRate: exchangeRate, 
      type,
      category: categoryId,
      accountId: fromAccountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      note,
      date: initialData ? initialData.date : new Date().toISOString(),
    });
  };

  const getActiveAccount = (id: string) => accounts.find(a => a.id === id) || accounts[0];

  if (accounts.length === 0) {
      return (
        <div className="fixed inset-0 bg-theme-bg z-50 flex items-center justify-center p-6">
            <div className="bg-theme-surface p-6 rounded-2xl border border-white/10 text-center max-w-sm w-full">
               <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X size={32} />
                </div>
                <h3 className="text-xl font-bold text-theme-primary mb-2">{t('noAccounts')}</h3>
                <p className="text-theme-secondary mb-6 text-sm">Please create a wallet first before adding transactions.</p>
                <button onClick={onClose} className="w-full py-3 bg-theme-surface border border-white/10 hover:bg-white/5 rounded-xl font-bold text-theme-primary">
                    {t('close')}
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-theme-bg z-50 flex flex-col font-sans h-[100dvh] overflow-hidden">
      {/* Account Selector Modal */}
      {showAccountSelector && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col justify-end animate-in fade-in duration-200">
              <div className="bg-theme-surface rounded-t-3xl p-6 h-[70%] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl text-theme-primary">{t('selectAccount')}</h3>
                      <button onClick={() => setShowAccountSelector(null)} className="p-2 bg-white/10 rounded-full text-theme-secondary"><X size={20}/></button>
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
                                 ? 'border-theme-brand bg-theme-brand/10' 
                                 : 'border-white/5 bg-white/5'
                             }`}
                          >
                              <div className="flex items-center gap-3">
                                  <span className="text-2xl">{acc.icon}</span>
                                  <div className="text-left">
                                      <div className="font-bold text-theme-primary">{acc.name}</div>
                                      <div className="text-xs text-theme-secondary">{acc.currency}</div>
                                  </div>
                              </div>
                              <div className="font-mono text-sm text-theme-primary">{acc.balance.toLocaleString()}</div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-4 relative">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-theme-secondary hover:bg-white/20 transition-colors">
          <X size={20} />
        </button>
        
        {/* Type Switcher */}
        <div className="flex items-center bg-theme-surface rounded-full p-1 border border-white/5">
            {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map((tType) => (
                <button
                    key={tType}
                    onClick={() => setType(tType)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        type === tType 
                        ? (tType === TransactionType.EXPENSE ? 'bg-red-500/20 text-red-400' : tType === TransactionType.INCOME ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400') 
                        : 'text-theme-secondary hover:text-theme-primary'
                    }`}
                >
                    {tType === TransactionType.EXPENSE ? t('expense') : tType === TransactionType.INCOME ? t('income') : t('transfer')}
                </button>
            ))}
        </div>

        <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 bg-white/10 rounded-full text-theme-secondary hover:bg-white/20 transition-colors">
              <div className="w-5 h-5 flex items-center justify-center font-bold pb-2">...</div>
            </button>
            {showMenu && (
                <div className="absolute right-0 top-12 bg-theme-surface border border-white/10 rounded-xl shadow-2xl p-2 min-w-[150px] z-50 animate-in fade-in zoom-in-95">
                    <button onClick={handleReset} className="w-full text-left px-4 py-2 text-sm text-theme-primary hover:bg-white/5 rounded-lg">Reset Form</button>
                </div>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-2 pb-2 overflow-y-auto no-scrollbar">
        
        {/* Amount Display */}
        <div className="flex flex-col items-center justify-center mb-6">
           <div className="flex items-baseline justify-center gap-1">
             <span className="text-3xl text-theme-secondary font-light mb-1">{currency === Currency.USD ? '$' : 'Bs.'}</span>
             <span className="text-6xl font-bold text-theme-primary tracking-tight break-all text-center">
                {amountStr}
             </span>
           </div>
           
           <div className="mt-4 flex items-center gap-2">
             <button 
               onClick={() => setCurrency(prev => prev === Currency.USD ? Currency.VES : Currency.USD)}
               className="flex items-center gap-1 bg-theme-surface hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-all"
             >
               <span className="text-sm font-bold text-theme-brand">{currency}</span>
               <ChevronDown size={14} className="text-theme-secondary" />
             </button>

             {/* Account Selection UX */}
             <div className="flex items-center bg-theme-surface rounded-full p-1 border border-white/10">
                 <button 
                    onClick={() => setShowAccountSelector('FROM')}
                    className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5"
                 >
                     <span className="text-sm">{getActiveAccount(fromAccountId).icon}</span>
                     <span className="text-xs font-bold text-theme-secondary max-w-[60px] truncate">{getActiveAccount(fromAccountId).name}</span>
                 </button>
                 
                 {type === TransactionType.TRANSFER && (
                     <>
                        <ArrowRightLeft size={12} className="text-theme-secondary mx-1" />
                        <button 
                            onClick={() => setShowAccountSelector('TO')}
                            className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5"
                        >
                            <span className="text-sm">{getActiveAccount(toAccountId).icon}</span>
                            <span className="text-xs font-bold text-theme-secondary max-w-[60px] truncate">{getActiveAccount(toAccountId).name}</span>
                        </button>
                     </>
                 )}
             </div>
           </div>
        </div>

        {/* Input Field */}
        <div className="bg-theme-surface border border-white/5 rounded-2xl p-1 flex items-center mb-6">
           <input 
             type="text" 
             value={note}
             onChange={(e) => setNote(e.target.value)}
             placeholder={t('notePlaceholder')}
             className="bg-transparent flex-1 px-4 py-3 text-sm text-theme-primary placeholder:text-theme-secondary outline-none w-full"
           />
            <button onClick={handleSpeechInput} className={`bg-theme-brand hover:brightness-110 text-white p-2.5 rounded-xl transition-colors m-1 shadow-lg shadow-brand/20 ${isListening ? 'animate-pulse bg-red-500' : ''}`}>
              <Mic size={18} />
            </button>
        </div>

        {/* Categories Carousel */}
        {type !== TransactionType.TRANSFER && (<>
        <div className="mb-4">
           <div className="flex items-center justify-between mb-3">
             <span className="text-xs font-bold text-theme-secondary tracking-wider uppercase flex items-center gap-1">
               {t('smartCategories')}
             </span>
             <button onClick={() => setShowAllCategories(!showAllCategories)} className="text-xs text-theme-brand font-bold flex items-center">
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
                            ? 'bg-theme-brand/20 border-theme-brand/50 text-theme-brand' 
                            : 'bg-theme-surface border-white/5 text-theme-secondary hover:bg-white/5'
                        }`}
                        >
                            <div className={`${categoryId === cat.id ? 'text-theme-brand' : 'text-theme-secondary'}`}>
                                {cat.icon}
                            </div>
                            <span className="text-[10px] font-medium truncate w-full text-center">{t(cat.name)}</span>
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
                            ? 'bg-theme-brand/20 border-theme-brand/50 text-theme-brand' 
                            : 'bg-theme-surface border-white/5 text-theme-secondary hover:bg-white/5'
                        }`}
                        >
                            <div className={`${categoryId === cat.id ? 'text-theme-brand' : 'text-theme-secondary'} mb-1`}>
                                {cat.icon}
                            </div>
                            <span className="text-[10px] font-medium">{t(cat.name)}</span>
                        </button>
                    ))}
               </div>
           )}
        </div>


        {/* Smart Suggestions */}
        <div className="mb-4">
             <div className="flex gap-2 flex-wrap">
                 {Object.entries(SMART_CATEGORIES)
                     .filter(([key, cat]) => cat === categoryId)
                     .slice(0, 5) // Show top 5 suggestions
                     .map(([key, cat]) => (
                     <button
                         key={key}
                         onClick={() => setNote(key.charAt(0).toUpperCase() + key.slice(1))}
                         className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-theme-secondary transition-colors"
                     >
                         {key.charAt(0).toUpperCase() + key.slice(1)}
                     </button>
                 ))}
             </div>
        </div>
        </>)}
      </div>

      {/* Keypad */}
      <div className="bg-theme-bg px-4 pb-6 pt-2 border-t border-white/5">
         {isCalculatorMode && (
           <div className="flex justify-between gap-2 mb-2 px-2">
             {['/', '*', '-', '+'].map(op => (
               <button 
                  key={op}
                  onClick={() => handleKeyPress(op)}
                  className="flex-1 bg-theme-brand/10 hover:bg-theme-brand/20 text-theme-brand py-2 rounded-lg font-bold"
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
                className="text-2xl font-medium text-theme-primary hover:text-theme-brand transition-colors py-2"
              >
                {num}
              </button>
            ))}
            
            <button 
              onClick={() => handleKeyPress('.')}
              className="text-2xl font-medium text-theme-primary hover:text-theme-brand transition-colors pb-2"
            >
              .
            </button>
            
            <button 
              onClick={() => handleKeyPress('0')}
              className="text-2xl font-medium text-theme-primary hover:text-theme-brand transition-colors pb-2"
            >
              0
            </button>
            
            <button 
              onClick={handleDelete}
              className="flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors pb-2"
            >
              <Delete size={24} />
            </button>
         </div>

         <div className="flex items-center gap-4 mt-6 px-2">
            <button 
              onClick={() => setIsCalculatorMode(!isCalculatorMode)}
              className={`p-4 rounded-2xl transition-colors ${isCalculatorMode ? 'bg-theme-brand text-white' : 'bg-white/5 text-theme-secondary hover:bg-white/10'}`}
            >
              <Calculator size={24} />
            </button>
            
            <button 
              onClick={isCalculatorMode ? handleCalculate : handleSave}
              className="flex-1 bg-theme-brand hover:brightness-110 active:scale-[0.98] text-white font-semibold h-14 rounded-2xl shadow-lg shadow-brand/30 flex items-center justify-center gap-2 transition-all"
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