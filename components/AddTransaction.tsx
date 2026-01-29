import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Delete, Check, Calculator, Mic, ChevronDown, Sparkles, ChevronRight, ArrowRightLeft, TrendingUp, TrendingDown, Search, Camera, Loader2, RefreshCcw, Image as ImageIcon } from 'lucide-react';

declare global {
  interface Window {
    Tesseract: any;
  }
}
const Tesseract = window.Tesseract;
import { FaWallet, FaBuildingColumns, FaCreditCard, FaMoneyBillWave, FaBitcoin, FaPaypal, FaCcVisa, FaCcMastercard, FaMobileScreen, FaPiggyBank } from 'react-icons/fa6';
import { TransactionType, Currency, Account, Language, Transaction } from '../types';
import { CATEGORIES, getSmartCategories } from '../constants';
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
  const [categorySearch, setCategorySearch] = useState('');
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCategoryModal) setShowCategoryModal(false);
        else if (showAccountSelector) setShowAccountSelector(null);
        else handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [handleClose, showCategoryModal, showAccountSelector]);

  const processImage = async (imageSource: CanvasImageSource | string) => {
    setIsScanning(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageSource, 'eng+spa');
      console.log("OCR Result:", text);
      
      const totalKeywords = ['total', 'neto', 'suma', 'amount', 'grand total', 'valor total', 'importe total', 'pago total', 'pagar', 'total a pagar'];
      const lines = text.split('\n');
      let foundAmount = null;
      let detectedCurrency: Currency | null = null;

      // detect currency from whole text first
      const lowerText = text.toLowerCase();
      if (lowerText.includes('bs') || lowerText.includes('ves') || lowerText.includes('bolivares') || lowerText.includes('bolívares')) {
          detectedCurrency = Currency.VES;
      } else if (lowerText.includes('$') || lowerText.includes('usd') || lowerText.includes('dolar') || lowerText.includes('dólar')) {
          detectedCurrency = Currency.USD;
      }

      for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (totalKeywords.some(kw => lowerLine.includes(kw))) {
              // Priority for total line currency detection
              if (lowerLine.includes('bs') || lowerLine.includes('ves')) detectedCurrency = Currency.VES;
              else if (lowerLine.includes('$') || lowerLine.includes('usd')) detectedCurrency = Currency.USD;

              // Improved regex: matches numbers like 1,234.56 or 1.234,56 or 1234.56
              const amountRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))|(\d+[.,]\d{1,2})|(\d+)/g;
              const matches = line.match(amountRegex);
              if (matches && matches.length > 0) {
                  // Usually the total is the last number on the "Total" line
                  foundAmount = matches[matches.length - 1];
                  break;
              }
          }
      }

      if (!foundAmount) {
          const amountRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))|(\d+[.,]\d{1,2})/g;
          const allMatches = text.match(amountRegex);
          if (allMatches) {
              const numbers = allMatches.map(m => {
                  // Basic normalization: remove thousands separators, set . as decimal
                  let cleaned = m.replace(/\s/g, '');
                  if (cleaned.includes(',') && cleaned.includes('.')) {
                      // format like 1,234.56 or 1.234,56
                      const lastDot = cleaned.lastIndexOf('.');
                      const lastComma = cleaned.lastIndexOf(',');
                      if (lastDot > lastComma) {
                          cleaned = cleaned.replace(/,/g, ''); // 1,234.56 -> 1234.56
                      } else {
                          cleaned = cleaned.replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
                      }
                  } else if (cleaned.includes(',')) {
                      // format like 1234,56
                      cleaned = cleaned.replace(',', '.');
                  }
                  const val = parseFloat(cleaned);
                  return isNaN(val) ? 0 : val;
              });
              if (numbers.length > 0) {
                foundAmount = Math.max(...numbers).toString();
              }
          }
      }
      
      if (foundAmount) {
        // Re-calculate or just use the val if we were in the non-keywords loop
        // To be safe, let's normalize the foundAmount one last time
        let forFinal = foundAmount.replace(/\s/g, '');
        if (forFinal.includes(',') && forFinal.includes('.')) {
            const lastDot = forFinal.lastIndexOf('.');
            const lastComma = forFinal.lastIndexOf(',');
            if (lastDot > lastComma) forFinal = forFinal.replace(/,/g, '');
            else forFinal = forFinal.replace(/\./g, '').replace(',', '.');
        } else if (forFinal.includes(',')) {
            forFinal = forFinal.replace(',', '.');
        }

        const cleanedAmount = forFinal;
        setAmountStr(cleanedAmount);
        if (detectedCurrency) {
            setCurrency(detectedCurrency);
            showAlert(`${t('totalFound') || 'Total found'}: ${detectedCurrency === Currency.USD ? '$' : 'Bs. '}${cleanedAmount}`, 'success');
        } else {
            showAlert(`${t('totalFound') || 'Total found'}: ${cleanedAmount}`, 'success');
        }
        stopScanner();
      } else {
        showAlert(t('totalNotFound') || 'Total not found in the invoice image', 'info');
      }
    } catch (err) {
      console.error("OCR Error:", err);
      showAlert('OCR Scan failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
      // Compatibility helper
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        await processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const t = (key: any) => getTranslation(lang, key);

  const handleSpeechInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
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
    const smartCats = getSmartCategories(lang);
    for (const key in smartCats) {
      if (lowerNote.includes(key)) {
        setCategoryId(smartCats[key]);
        return;
      }
    }
  }, [note, initialData, lang]);

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
      scheduledId: initialData?.scheduledId,
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
                <button onClick={handleClose} className="w-full py-3 bg-theme-surface border border-white/10 hover:bg-white/5 rounded-xl font-bold text-theme-primary">
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
        <button onClick={handleClose} className="p-2 bg-white/10 rounded-full text-theme-secondary hover:bg-white/20 transition-colors">
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
             <div className="flex gap-2 p-1">
                <div className="relative">
                    <button 
                        onClick={() => setShowScanOptions(!showScanOptions)} 
                        title="Scan Options" 
                        className={`p-2.5 rounded-xl transition-all shadow-lg border ${showScanOptions || isScanning ? 'bg-theme-brand text-white border-theme-brand' : 'bg-theme-surface hover:bg-white/10 text-theme-secondary border-white/5'}`}
                    >
                        {isScanning ? <Loader2 size={18} className="animate-spin text-white" /> : <Camera size={18} />}
                    </button>
                    
                    {showScanOptions && (
                        <div className="absolute bottom-full mb-2 right-0 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl p-2 min-w-[200px] z-[60] animate-in fade-in slide-in-from-bottom-2">
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment"
                                    onChange={(e) => { setShowScanOptions(false); handleFileSelect(e); }} 
                                    className="hidden" 
                                    id="camera-capture-input" 
                                />
                                <label 
                                    htmlFor="camera-capture-input" 
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-primary hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                >
                                    <Camera size={16} className="text-theme-brand" />
                                    <span className="font-bold">{t('openCamera') || 'Abrir Cámara'}</span>
                                </label>
                            </div>
                            
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => { setShowScanOptions(false); handleFileSelect(e); }} 
                                    className="hidden" 
                                    id="gallery-input-main" 
                                />
                                <label 
                                    htmlFor="gallery-input-main" 
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-primary hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                >
                                    <ImageIcon size={16} className="text-theme-brand" />
                                    <span className="font-bold">{t('attachImage') || 'Adjuntar Imagen'}</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleSpeechInput} 
                    className={`p-2.5 rounded-xl transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/20' : 'bg-theme-brand hover:brightness-110 text-white shadow-brand/20'}`}
                >
                    <Mic size={18} />
                </button>
            </div>
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
            <div className="p-4 border-b border-white/5 bg-theme-surface">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-theme-primary">{t('selectCategory') || 'Select Category'}</h2>
                    <button onClick={() => { setShowCategoryModal(false); setCategorySearch(''); }} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><X size={20}/></button>
                </div>
                {/* Search Bar */}
                <div className="relative">
                    <input 
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder={t('search') || 'Search...'}
                        className="w-full bg-theme-bg border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-theme-primary placeholder:text-theme-secondary outline-none focus:border-theme-brand transition-colors"
                        autoFocus
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary" />
                    {categorySearch && (
                        <button 
                            onClick={() => setCategorySearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-secondary hover:text-theme-primary"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
                 <div className="flex flex-col gap-4 pb-10">
                     {CATEGORIES.filter(cat => {
                         const translatedName = (t(cat.name) || cat.name).toLowerCase();
                         const query = categorySearch.toLowerCase();
                         if (translatedName.includes(query)) return true;
                         
                         const shortcuts = Object.entries(getSmartCategories(lang))
                             .filter(([_, catId]) => catId === cat.id)
                             .map(([key]) => key.toLowerCase());
                         
                         return shortcuts.some(s => s.includes(query));
                     }).map(cat => {
                         const shortcuts = Object.entries(getSmartCategories(lang))
                             .filter(([_, catId]) => catId === cat.id)
                             .map(([key]) => key);

                         return (
                             <div key={cat.id} className="bg-theme-surface border border-white/5 rounded-2xl p-4">
                                 <button
                                     onClick={() => { setCategoryId(cat.id); setShowCategoryModal(false); setCategorySearch(''); }}
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
                                                     setCategorySearch('');
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
