import React, { useState, useEffect } from 'react';
import { X, Delete, Check, Calculator, Mic, ChevronDown, Sparkles, ChevronRight, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { FaWallet, FaBuildingColumns, FaCreditCard, FaMoneyBillWave, FaBitcoin, FaPaypal, FaCcVisa, FaCcMastercard, FaMobileScreen, FaPiggyBank } from 'react-icons/fa6';
import { TransactionType, Currency, Account, Language, Transaction } from '../types';
import { CATEGORIES, SMART_CATEGORIES } from '../constants';
import { getTranslation } from '../i18n';

// Icon Map for Financial Services
const ACCOUNT_ICONS: Record<string, React.ElementType> = {
    'wallet': FaWallet,
    'bank': FaBuildingColumns,
    'card': FaCreditCard,
    'visa': FaCcVisa,
    'mastercard': FaCcMastercard,
    'cash': FaMoneyBillWave,
    'crypto': FaBitcoin,
    'paypal': FaPaypal,
    'mobile': FaMobileScreen,
    'savings': FaPiggyBank
};

// Helper to render icon safely
const renderAccountIcon = (iconKey: string, size: number = 24) => {
    const IconComponent = ACCOUNT_ICONS[iconKey];
    if (IconComponent) return <IconComponent size={size} />;
    return <span style={{ fontSize: size }}>{iconKey}</span>; 
};

interface AddTransactionProps {
  onClose: () => void;
  onSave: (data: any) => void;
  exchangeRate: number;
  accounts: Account[];
  lang: Language;
  initialData?: Transaction | null;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AddTransaction: React.FC<AddTransactionProps> = ({ onClose, onSave, exchangeRate, accounts, lang, initialData, showAlert }) => {
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
  const [date, setDate] = useState(initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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
      showAlert('alert_speechNotSupported', 'error');
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
      date: new Date(date).toISOString(),
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
                                  <span className="text-2xl">{renderAccountIcon(acc.icon, 24)}</span>
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
                     <span className="text-sm">{renderAccountIcon(getActiveAccount(fromAccountId).icon, 16)}</span>
                     <span className="text-xs font-bold text-theme-secondary max-w-[60px] truncate">{getActiveAccount(fromAccountId).name}</span>
                 </button>
                 
                 {type === TransactionType.TRANSFER && (
                     <>
                        <ArrowRightLeft size={12} className="text-theme-secondary mx-1" />
                        <button 
                            onClick={() => setShowAccountSelector('TO')}
                            className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/5"
                        >
                            <span className="text-sm">{renderAccountIcon(getActiveAccount(toAccountId).icon, 16)}</span>
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

        {/* Date and Category Selection */}
        <div className="flex gap-4 mb-4">
             <div className="flex-1">
                 <label className="text-xs text-theme-secondary mb-1 block uppercase tracking-wider font-bold">{t('date') || 'Date'}</label>
                 <div className="relative">
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-theme-surface border border-white/5 rounded-xl p-3 pl-10 text-theme-primary outline-none focus:border-theme-brand transition-colors text-sm font-bold"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none">
                        <Sparkles size={16} className="text-theme-brand" />
                    </div>
                 </div>
             </div>
             
             {type !== TransactionType.TRANSFER && (
                 <div className="flex-1">
                     <label className="text-xs text-theme-secondary mb-1 block uppercase tracking-wider font-bold">{t('category') || 'Category'}</label>
                     <button 
                         onClick={() => setShowCategoryModal(true)}
                         className="w-full bg-theme-surface border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-theme-brand transition-colors h-[46px]"
                     >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className={`${CATEGORIES.find(c => c.id === categoryId)?.color || 'text-theme-primary'}`}>
                                {CATEGORIES.find(c => c.id === categoryId)?.icon}
                            </span>
                            <span className="text-xs font-bold text-theme-primary truncate">
                                {t(CATEGORIES.find(c => c.id === categoryId)?.name) || CATEGORIES.find(c => c.id === categoryId)?.name}
                            </span>
                        </div>
                        <ChevronDown size={14} className="text-theme-secondary group-hover:text-theme-primary flex-shrink-0" />
                     </button>
                 </div>
             )}
        </div>
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
      
       {/* Category Modal */}
       {showCategoryModal && (
        <div className="fixed inset-0 bg-theme-bg z-[60] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-theme-surface">
                <h2 className="text-lg font-bold text-theme-primary">{t('selectCategory') || 'Select Category'}</h2>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
                 <div className="flex flex-col gap-4 pb-10">
                     {CATEGORIES.map(cat => {
                         const shortcuts = Object.entries(SMART_CATEGORIES)
                             .filter(([_, catId]) => catId === cat.id)
                             .map(([key]) => key);

                         return (
                             <div key={cat.id} className="bg-theme-surface border border-white/5 rounded-2xl p-4">
                                 <button
                                     onClick={() => { setCategoryId(cat.id); setShowCategoryModal(false); }}
                                     className={`w-full flex items-center gap-3 mb-3 p-2 rounded-xl transition-colors ${categoryId === cat.id ? 'bg-theme-brand/10 text-theme-brand' : 'hover:bg-white/5'}`}
                                 >
                                     <div className={`p-2 rounded-lg ${cat.color} bg-opacity-20`}>
                                         {cat.icon}
                                     </div>
                                     <span className="text-lg font-bold text-theme-primary flex-1 text-left">
                                         {t(cat.name) || cat.name}
                                     </span>
                                     {categoryId === cat.id && <Check size={16} />}
                                 </button>

                                 {shortcuts.length > 0 && (
                                     <div className="flex flex-wrap gap-2 pl-2 border-t border-white/5 pt-3">
                                         {shortcuts.map(key => (
                                             <button
                                                 key={key}
                                                 onClick={() => { 
                                                     setCategoryId(cat.id); 
                                                     setNote(key.charAt(0).toUpperCase() + key.slice(1)); 
                                                     setShowCategoryModal(false); 
                                                 }}
                                                 className="px-3 py-1.5 bg-theme-bg/50 border border-white/5 rounded-lg text-xs font-medium text-theme-secondary hover:bg-white/10 hover:text-theme-primary transition-colors capitalize"
                                             >
                                                 {key}
                                             </button>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         );
                     })}
                 </div>
            </div>
        </div>
       )}
    </div>
  );
};