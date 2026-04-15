import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Delete, Check, Calculator, Mic, ChevronDown, Sparkles, ChevronRight, ArrowRightLeft, TrendingUp, TrendingDown, Search, Camera, Loader2, RefreshCcw, Image as ImageIcon, Calendar, Edit2, Trash2, ArrowLeft, MoreVertical } from 'lucide-react';

declare global {
  interface Window {
    Tesseract: any;
  }
}
const Tesseract = window.Tesseract;
import { FaWallet, FaBuildingColumns, FaCreditCard, FaMoneyBillWave, FaBitcoin, FaPaypal, FaCcVisa, FaCcMastercard, FaMobileScreen, FaPiggyBank } from 'react-icons/fa6';
import { TransactionType, Currency, Account, Language, Transaction, Budget } from '../types';
import { CATEGORIES, getSmartCategories } from '../constants';
import { getTranslation } from '../i18n';
import { div } from 'framer-motion/client';

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
  euroRate?: number;
  transactions: Transaction[];
  budgets: Budget[];
}

export const AddTransaction: React.FC<AddTransactionProps> = ({ onClose, onSave, exchangeRate, euroRate, accounts, lang, initialData, showAlert, transactions, budgets }) => {
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

  const fAcc = accounts.find(a => a.id === fromAccountId) || accounts[0];
  const tAcc = accounts.find(a => a.id === toAccountId) || (accounts.length > 1 ? accounts[1] : accounts[0]);
  const isSameCurrencyTransfer = type === TransactionType.TRANSFER && fAcc.currency === tAcc.currency;
  const [focusedField, setFocusedField] = useState<'amount' | 'exchangeRate' | 'commissionFixed' | 'commissionPercent'>('amount');
  const [manualExchangeRate, setManualExchangeRate] = useState<string>(initialData?.exchangeRate?.toString() || exchangeRate.toString());
  const [commissionFixed, setCommissionFixed] = useState<string>(initialData?.fee?.toString() || '0');
  const [commissionPercent, setCommissionPercent] = useState<string>('0');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);
  const [monthDropPos, setMonthDropPos] = useState<{top:number;left:number;width:number} | null>(null);

  const [categoryId, setCategoryId] = useState<string>(initialData ? initialData.category : CATEGORIES[0].id);

  // Auto-set category for transfers
  useEffect(() => {
    if (initialData) return;
    if (type === TransactionType.TRANSFER) {
      setCategoryId('transfer');
    } else if (categoryId === 'transfer') {
      // Revert to food (index 1) if switching away from transfer
      setCategoryId(CATEGORIES[1].id);
    }
  }, [type, initialData, categoryId]);

  // Force same currency for same-account/same-currency transfers
  useEffect(() => {
    if (isSameCurrencyTransfer && currency !== fAcc.currency) {
      setCurrency(fAcc.currency);
    }
  }, [isSameCurrencyTransfer, fAcc.currency, currency]);
  // Update manualExchangeRate when accounts change in transfer
  useEffect(() => {
    if (type !== TransactionType.TRANSFER || initialData) return;
    
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc || fromAcc.currency === toAcc.currency) return;

    const fromCur = fromAcc.currency;
    const toCur = toAcc.currency;
    
    let rate = 1;
    const isVES = (c: string) => c === Currency.VES;
    const isUSD = (c: string) => c === Currency.USD || c === Currency.USDT;
    const isEUR = (c: string) => c === Currency.EUR;

    // Cross-currency transfer logic
    if (isUSD(fromCur) && isVES(toCur)) rate = exchangeRate;
    else if (isVES(fromCur) && isUSD(toCur)) rate = 1 / exchangeRate;
    else if (isEUR(fromCur) && isVES(toCur)) rate = euroRate || 1;
    else if (isVES(fromCur) && isEUR(toCur)) rate = 1 / (euroRate || 1);
    // Note: EUR <-> USD is blocked by UI/Filter, but logic would result in 1 if selected

    setManualExchangeRate(rate.toFixed(4));
  }, [fromAccountId, toAccountId, type, exchangeRate, euroRate, accounts, initialData]);

  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState<'FROM' | 'TO' | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [date, setDate] = useState(initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [budgetMonth, setBudgetMonth] = useState(initialData?.budgetMonth || '');
  const [fiscalTag, setFiscalTag] = useState<'TAXABLE_INCOME' | 'DEDUCTIBLE_EXPENSE' | 'NEUTRAL'>(initialData?.fiscalTag || 'NEUTRAL');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(initialData?.receipt || null);
  const [showBudgetMonthPicker, setShowBudgetMonthPicker] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 20, y: 30, width: 60, height: 40 }); // Relative %
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Input Refs for cursor-aware keypad
  const amountRef = useRef<HTMLInputElement>(null);
  const exchangeRateRef = useRef<HTMLInputElement>(null);
  const commFixedRef = useRef<HTMLInputElement>(null);
  const commPercentRef = useRef<HTMLInputElement>(null);

  const getActiveRef = () => {
    if (focusedField === 'amount') return amountRef;
    if (focusedField === 'exchangeRate') return exchangeRateRef;
    if (focusedField === 'commissionFixed') return commFixedRef;
    if (focusedField === 'commissionPercent') return commPercentRef;
    return null;
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCameraModal) {
            stopCamera();
        } else if (showCropModal) {
            setShowCropModal(false);
            setSelectedImage(null);
        } else if (showCategoryModal) setShowCategoryModal(false);
        else if (showAccountSelector) setShowAccountSelector(null);
        else handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [handleClose, showCategoryModal, showAccountSelector]);

  const processImage = async (imageSource: HTMLCanvasElement | string) => {
    setIsScanning(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageSource, 'eng+spa');
      console.log("OCR Result:", text);
      
      const totalKeywords = ['total', 'neto', 'suma', 'amount', 'grand total', 'valor total', 'importe total', 'pago total', 'pagar', 'total a pagar'];
      const lines = text.split('\n');
      let foundAmount = null;
      let detectedCurrency: Currency | null = null;

      // Detect currency from whole text first
      const lowerText = text.toLowerCase();
      if (lowerText.includes('bs') || lowerText.includes('ves') || lowerText.includes('bolivares') || lowerText.includes('bolívares')) {
          detectedCurrency = Currency.VES;
      } else if (lowerText.includes('$') || lowerText.includes('usd') || lowerText.includes('dolar') || lowerText.includes('dólar')) {
          detectedCurrency = Currency.USD;
      }

      for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lowerLine = line.toLowerCase();
          
          if (totalKeywords.some(kw => lowerLine.includes(kw))) {
              if (lowerLine.includes('bs') || lowerLine.includes('ves')) detectedCurrency = Currency.VES;
              else if (lowerLine.includes('$') || lowerLine.includes('usd')) detectedCurrency = Currency.USD;

              const amountRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))|(\d+[.,]\d{1,2})|(\d+)/g;
              const matches = line.match(amountRegex);
              
              if (matches && matches.length > 0) {
                  foundAmount = matches[matches.length - 1];
                  break;
              } else if (i + 1 < lines.length) {
                  const nextLineMatches = lines[i+1].match(amountRegex);
                  if (nextLineMatches && nextLineMatches.length > 0) {
                      foundAmount = nextLineMatches[nextLineMatches.length - 1];
                      break;
                  }
              }
          }
      }

      if (!foundAmount) {
          const amountRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))|(\d+[.,]\d{1,2})|(\d+)/g;
          const allMatches = text.match(amountRegex);
          
          if (allMatches) {
              const numbers = allMatches.map(m => {
                  let cleaned = m.replace(/\s/g, '');
                  if (cleaned.includes(',') && cleaned.includes('.')) {
                      const lastDot = cleaned.lastIndexOf('.');
                      const lastComma = cleaned.lastIndexOf(',');
                      if (lastDot > lastComma) cleaned = cleaned.replace(/,/g, '');
                      else cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                  } else if (cleaned.includes(',')) {
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
        
        // Auto-save the full image as receipt
        if (selectedImage) setReceiptImage(selectedImage);

        if (detectedCurrency) {
            setCurrency(detectedCurrency);
            showAlert(`${t('totalFound')}: ${detectedCurrency === Currency.USD ? '$' : 'Bs '}${cleanedAmount}`, 'success');
        } else {
            showAlert(`${t('totalFound')}: ${cleanedAmount}`, 'success');
        }
        setShowCropModal(false);
        setSelectedImage(null);
      } else {
        showAlert(t('totalNotFound'), 'info');
      }
    } catch (err) {
      console.error("OCR Error:", err);
      showAlert(t('alert_ocrFailed'), 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyCrop = () => {
    if (!imgRef.current || !selectedImage) return;

    const canvas = document.createElement('canvas');
    const img = imgRef.current;
    
    // Calculate actual pixel coordinates
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    
    const x = (cropBox.x * img.clientWidth / 100) * scaleX;
    const y = (cropBox.y * img.clientHeight / 100) * scaleY;
    const width = (cropBox.width * img.clientWidth / 100) * scaleX;
    const height = (cropBox.height * img.clientHeight / 100) * scaleY;

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
        processImage(canvas);
    }
  };

  const startCamera = async () => {
    setShowCameraModal(true);
    // Wait for modal to render
    setTimeout(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            showAlert(t('alert_cameraDenied'), 'error');
            setShowCameraModal(false);
        }
    }, 100);
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      setShowCameraModal(false);
  };

  const capturePhoto = () => {
      if (!videoRef.current) return;
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/jpeg');
          
          stopCamera();
          setSelectedImage(imageData);
          setShowCropModal(true);
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        setSelectedImage(imageData);
        setShowCropModal(true);
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
      return isFinite(result) ? String(Math.round(result * 10000) / 10000) : 'Error';
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
    const ref = getActiveRef();
    if (!ref?.current) return;

    const start = ref.current.selectionStart || 0;
    const end = ref.current.selectionEnd || 0;

    const update = (prev: string) => {
      let before = prev.slice(0, start);
      let after = prev.slice(end);

      // Special handling for '0' placeholder
      if (prev === '0' && val !== '.') {
          before = '';
          after = '';
      }

      // Special handling for decimals
      if (val === '.') {
          const parts = (before + after).split(/[\+\-\*\/]/);
          const lastPart = parts[parts.length - 1]; // This is simplified, in cursor mode it's more complex
          // For simplicity, we'll just check the current "segment" the cursor is in
          const lastOperatorIndex = Math.max(before.lastIndexOf('+'), before.lastIndexOf('-'), before.lastIndexOf('*'), before.lastIndexOf('/'));
          const currentSegmentBefore = before.slice(lastOperatorIndex + 1);
          const nextOperatorIndex = after.search(/[\+\-\*\/]/);
          const currentSegmentAfter = nextOperatorIndex === -1 ? after : after.slice(0, nextOperatorIndex);
          
          if ((currentSegmentBefore + currentSegmentAfter).includes('.')) return prev;
      }
      
      const isOperator = ['+', '-', '*', '/'].includes(val);
      const lastChar = before.slice(-1);
      const lastIsOperator = ['+', '-', '*', '/'].includes(lastChar);
      
      if (isOperator && lastIsOperator) {
         before = before.slice(0, -1);
      }
      
      return before + val + after;
    };

    const newPos = start + val.length;

    if (focusedField === 'amount') setAmountStr(update);
    else if (focusedField === 'exchangeRate') setManualExchangeRate(update);
    else if (focusedField === 'commissionFixed') setCommissionFixed(update);
    else if (focusedField === 'commissionPercent') setCommissionPercent(update);

    setTimeout(() => {
        if (ref.current) {
            ref.current.focus();
            ref.current.setSelectionRange(newPos, newPos);
        }
    }, 0);
  };

  const handleDelete = () => {
    const ref = getActiveRef();
    if (!ref?.current) return;

    const start = ref.current.selectionStart || 0;
    const end = ref.current.selectionEnd || 0;

    if (start === 0 && start === end) return; // Nothing to delete before cursor

    const update = (prev: string) => {
      if (prev === 'Error') return '0';
      
      let newVal;
      if (start === end) {
          newVal = prev.slice(0, start - 1) + prev.slice(start);
      } else {
          newVal = prev.slice(0, start) + prev.slice(end);
      }
      return newVal || '0';
    };

    const newPos = start === end ? Math.max(0, start - 1) : start;

    if (focusedField === 'amount') setAmountStr(update);
    else if (focusedField === 'exchangeRate') setManualExchangeRate(update);
    else if (focusedField === 'commissionFixed') setCommissionFixed(update);
    else if (focusedField === 'commissionPercent') setCommissionPercent(update);

    setTimeout(() => {
        if (ref.current) {
            ref.current.focus();
            ref.current.setSelectionRange(newPos, newPos);
        }
    }, 0);
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

    const commFixedVal = parseFloat(commissionFixed) || 0;
    const commPercentVal = parseFloat(commissionPercent) || 0;
    const finalFee = isSameCurrencyTransfer ? 0 : (commFixedVal + (finalAmount * (commPercentVal / 100)));

    onSave({
      id: initialData?.id, // Pass ID if editing
      amount: finalAmount,
      originalCurrency: currency,
      exchangeRate: type === TransactionType.TRANSFER && getActiveAccount(fromAccountId).currency !== getActiveAccount(toAccountId).currency 
        ? parseFloat(manualExchangeRate) 
        : exchangeRate,
      euroRate: euroRate, 
      type,
      category: categoryId,
      accountId: fromAccountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      note,
      date: new Date(date).toISOString(),
      budgetMonth: budgetMonth || undefined,
      fiscalTag: type !== TransactionType.TRANSFER ? fiscalTag : 'NEUTRAL',
      fee: finalFee,
      scheduledId: initialData?.scheduledId,
      receipt: receiptImage
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
                <p className="text-theme-secondary mb-6 text-sm">{t('alert_createWalletFirst')}</p>
                <button onClick={handleClose} className="w-full py-3 bg-theme-surface border border-white/10 hover:bg-white/5 rounded-xl font-bold text-theme-primary">
                    {t('close')}
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-theme-bg z-50 flex flex-col h-[100dvh] overflow-hidden select-none">
      {/* Main Container 100dvh */}
      {/* Account Selector Modal */}
      {showAccountSelector && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col justify-end animate-in fade-in duration-200">
              <div className="bg-theme-surface rounded-t-2xl p-6 h-[70%] overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl text-theme-primary">{t('selectAccount')}</h3>
                      <button onClick={() => setShowAccountSelector(null)} className="p-2 bg-white/10 rounded-full text-theme-secondary"><X size={20}/></button>
                  </div>
                  <div className="grid gap-3">
                      {accounts
                        .filter(acc => {
                            if (type === TransactionType.TRANSFER) {
                                // Transfer rules: 
                                // 1. From account must match currency if it was selected in main UI
                                // 2. No transfers between EUR and USD/USDT
                                // 3. Cross-currency only allowed to/from VES
                                const fromAcc = accounts.find(a => a.id === fromAccountId);
                                const toAcc = accounts.find(a => a.id === toAccountId);
                                
                                if (showAccountSelector === 'FROM') {
                                    // If we are picking FROM, check against existing TO (if any)
                                    if (toAcc) {
                                        const isEUR = (c: string) => c === Currency.EUR;
                                        const isUSD = (c: string) => c === Currency.USD || c === Currency.USDT;
                                        if (isEUR(toAcc.currency) && isUSD(acc.currency)) return false;
                                        if (isUSD(toAcc.currency) && isEUR(acc.currency)) return false;
                                    }
                                    return true;
                                } else {
                                    // If we are picking TO, check against FROM
                                    if (fromAcc) {
                                        const isEUR = (c: string) => c === Currency.EUR;
                                        const isUSD = (c: string) => c === Currency.USD || c === Currency.USDT;
                                        if (isEUR(fromAcc.currency) && isUSD(acc.currency)) return false;
                                        if (isUSD(fromAcc.currency) && isEUR(acc.currency)) return false;
                                    }
                                    return true;
                                }
                            }
                            const isUSDType = (c: Currency) => c === Currency.USD || c === Currency.USDT;
                            if (isUSDType(currency)) return isUSDType(acc.currency);
                            return acc.currency === currency;
                        })
                        .map(acc => (
                          <button 
                             key={acc.id}
                             onClick={() => {
                                 const isFrom = showAccountSelector === 'FROM';
                                 if (isFrom) {
                                     setFromAccountId(acc.id);
                                     if (type === TransactionType.TRANSFER && acc.id === toAccountId) {
                                         const differentAcc = accounts.find(a => a.id !== acc.id);
                                         if (differentAcc) setToAccountId(differentAcc.id);
                                     }
                                     if (acc.currency !== currency) setCurrency(acc.currency);
                                 } else {
                                     setToAccountId(acc.id);
                                     if (type === TransactionType.TRANSFER && acc.id === fromAccountId) {
                                         const differentAcc = accounts.find(a => a.id !== acc.id);
                                         if (differentAcc) setFromAccountId(differentAcc.id);
                                     }
                                 }
                                 setShowAccountSelector(null);
                             }}
                             className={`p-4 rounded-2xl flex items-center justify-between border ${
                                 (showAccountSelector === 'FROM' ? fromAccountId : toAccountId) === acc.id 
                                 ? 'border-theme-soft bg-theme-brand/10' 
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
                              <div className="font-mono text-sm text-theme-primary">{acc.balance?.toLocaleString()}</div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Header — BudgetView Style */}
      <div className="flex items-center gap-4 px-6 py-4 bg-theme-bg">
        <button
          onClick={handleClose}
          className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-theme-primary tracking-tight">{t('add_transaction')}</h2>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl p-2 min-w-[200px] z-50 animate-in fade-in zoom-in-95">
              <button onClick={handleReset} className="w-full text-left px-4 py-3 text-sm font-bold text-theme-primary hover:bg-white/5 rounded-2xl flex items-center gap-3">
                <RefreshCcw size={16} className="text-theme-secondary" />
                {t('resetForm')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Type Switcher — BudgetView Tab Style */}
      <div className="flex px-4 mb-3">
        <div className="flex bg-theme-surface rounded-2xl p-1 w-full shadow-inner border border-white/5">
          {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map((tType) => (
            <button
              key={tType}
              onClick={() => setType(tType)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold transition-all duration-200 ${
                type === tType
                  ? 'bg-theme-bg text-theme-primary shadow-lg'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                type === tType
                  ? tType === TransactionType.EXPENSE ? 'bg-red-400' : tType === TransactionType.INCOME ? 'bg-emerald-400' : 'bg-blue-400'
                  : 'bg-transparent'
              }`} />
              {tType === TransactionType.EXPENSE ? t('expense') : tType === TransactionType.INCOME ? t('income') : t('transfer')}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Area with Input and Toolbar */}
      <div className="flex-1 bg-theme-bg px-4 pb-3 pt-2 relative flex flex-col">
        {/* Receipt Preview Row */}
        {receiptImage && (
            <div className="px-2 mb-4 animate-in slide-in-from-left duration-300">
                <div className="relative inline-block group">
                    <img 
                      src={receiptImage} 
                      alt="Receipt" 
                      className="w-16 h-20 object-cover rounded-2xl border-2 border-theme-brand shadow-2xl" 
                    />
                    <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setSelectedImage(receiptImage); setShowCropModal(true); }}
                          className="p-1.5 bg-theme-brand text-white rounded-lg shadow-lg"
                        >
                            <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => setReceiptImage(null)}
                          className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            </div>
        )}
        {/* Amount Section */}
        <div className="flex flex-col items-center justify-center mb-4 mt-1 relative">
            <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl text-theme-secondary font-light">{(currency === Currency.USD || currency === Currency.USDT) ? '$' : currency === Currency.EUR ? '€' : 'Bs'}</span>
                    <input
                        ref={amountRef}
                        type="text"
                        inputMode="none"
                        value={amountStr}
                        onChange={(e) => { const val = e.target.value.replace(',', '.'); setAmountStr(val.replace(/[^0-9\.\+\-\*\/]/g, '')); }}
                        onFocus={() => setFocusedField('amount')}
                        className={`bg-transparent text-5xl font-bold tracking-tighter outline-none w-48 text-center selection:bg-theme-brand/20 ${focusedField === 'amount' ? 'text-theme-brand' : 'text-theme-primary'}`}
                    />
                </div>
                
                
                {/* Currency Pill Toggle */}
                {!isSameCurrencyTransfer && (
                    <div className="flex bg-theme-surface border border-white/10 p-1 rounded-2xl shadow-lg">
                        {[Currency.USD, Currency.VES].map((cur) => (
                            <button
                                key={cur}
                                onClick={() => {
                                    if (type === TransactionType.TRANSFER && currency !== cur) {
                                        const prevFrom = fromAccountId;
                                        setFromAccountId(toAccountId);
                                        setToAccountId(prevFrom);
                                    }
                                    setCurrency(cur);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${currency === cur ? 'bg-theme-brand text-white shadow-md' : 'text-theme-secondary hover:text-theme-primary opacity-60'}`}
                            >
                                {cur === Currency.VES ? 'VES' : 'USD'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversion Summary */}
            {!isSameCurrencyTransfer && (
                <div className="mt-1 flex items-center justify-center gap-1.5 opacity-60">
                    <span className="text-xs font-medium text-theme-secondary italic">
                        ≈ {(() => {
                            const amt = parseFloat(amountStr) || 0;
                            if (currency === Currency.USD || currency === Currency.USDT) {
                                return `Bs. ${(amt * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                            } else if (currency === Currency.VES) {
                                return `$ ${(amt / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                            } else if (currency === Currency.EUR) {
                                return `Bs. ${(amt * (euroRate || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                            }
                            return '';
                        })()}
                    </span>
                </div>
            )}

            {/* Compact Commissions (New Position) */}
            {((type === TransactionType.TRANSFER && !isSameCurrencyTransfer) || type === TransactionType.EXPENSE) && (
                <div className="mt-2 w-full max-w-md mx-auto px-2 animate-in fade-in zoom-in duration-300">
                    <div className="bg-theme-surface rounded-2xl p-2 flex items-center gap-4 border border-white/5 shadow-inner">
                        <div className="flex flex-col flex-1 pl-1">
                            <span className="text-[7px] font-black text-theme-secondary opacity-50 uppercase tracking-[0.2em]">TOTAL</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-theme-brand">
                                    {(() => {
                                        const amount = parseFloat(amountStr) || 0;
                                        const commF = parseFloat(commissionFixed) || 0;
                                        const commP = parseFloat(commissionPercent) || 0;
                                        const fee = commF + (amount * (commP / 100));
                                        if (type === TransactionType.TRANSFER) {
                                            let total = amount - fee;
                                            if (getActiveAccount(fromAccountId).currency !== getActiveAccount(toAccountId).currency)
                                                total = total * (parseFloat(manualExchangeRate) || 1);
                                            return total.toLocaleString(undefined, { maximumFractionDigits: 2 });
                                        }
                                        return (amount + fee).toLocaleString(undefined, { maximumFractionDigits: 2 });
                                    })()}
                                </span>
                                <span className="text-[8px] font-black text-theme-brand opacity-60">
                                    {type === TransactionType.TRANSFER ? getActiveAccount(toAccountId).currency : currency}
                                </span>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/5" />

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                             <div className="flex flex-col">
                                <span className="text-[7px] font-black text-theme-secondary opacity-40 uppercase">{t('fixed')}</span>
                                <input ref={commFixedRef} type="text" inputMode="none" value={commissionFixed}
                                    onChange={(e) => { const v = e.target.value.replace(',', '.'); setCommissionFixed(v.replace(/[^0-9\.]/g, '')); }}
                                    onFocus={() => setFocusedField('commissionFixed')}
                                    className="bg-transparent text-[11px] font-bold text-theme-primary outline-none focus:text-theme-brand w-12"
                                />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[7px] font-black text-theme-secondary opacity-40 uppercase">%</span>
                                <input ref={commPercentRef} type="text" inputMode="none" value={commissionPercent}
                                    onChange={(e) => { const v = e.target.value.replace(',', '.'); setCommissionPercent(v.replace(/[^0-9\.]/g, '')); }}
                                    onFocus={() => setFocusedField('commissionPercent')}
                                    className="bg-transparent text-[11px] font-bold text-theme-primary outline-none focus:text-theme-brand w-12"
                                />
                             </div>
                        </div>

                        {type === TransactionType.TRANSFER && getActiveAccount(fromAccountId).currency !== getActiveAccount(toAccountId).currency && (
                             <>
                                <div className="h-8 w-px bg-white/5" />
                                <div className="flex flex-col pr-1">
                                    <span className="text-[7px] font-black text-theme-secondary opacity-40 uppercase">{t('rate')}</span>
                                    <input ref={exchangeRateRef} type="text" inputMode="none" value={manualExchangeRate}
                                        onChange={(e) => { const v = e.target.value.replace(',', '.'); setManualExchangeRate(v.replace(/[^0-9\.]/g, '')); }}
                                        onFocus={() => setFocusedField('exchangeRate')}
                                        className="bg-transparent text-[11px] font-bold text-theme-brand outline-none w-14"
                                    />
                                </div>
                             </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Note / Search Bar — moved below amount */}
        <div className="px-1 mb-2">
            <div className="bg-theme-surface rounded-2xl p-1 flex items-center shadow-sm">
                <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('notePlaceholder')}
                    className="bg-transparent flex-1 px-4 py-2 text-sm font-medium text-theme-primary placeholder:text-theme-secondary outline-none w-full"
                />
                <button onClick={handleSpeechInput} className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-theme-secondary hover:text-theme-primary'}`}>
                    <Mic size={18} />
                </button>
                <div className="relative">
                    <button onClick={() => setShowScanOptions(!showScanOptions)} className="p-2.5 text-theme-secondary hover:text-theme-primary"><Camera size={18} /></button>
                    {showScanOptions && (
                        <div className="absolute top-full mt-2 right-0 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl p-2 min-w-[200px] z-[60] animate-in fade-in slide-in-from-top-2">
                            <button onClick={() => { setShowScanOptions(false); startCamera(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-primary hover:bg-white/5 rounded-xl">
                                <Camera size={18} className="text-theme-brand" />
                                <span className="font-bold">{t('openCamera')}</span>
                            </button>
                            <button onClick={() => { const input = document.getElementById('gallery-input-footer'); if(input) input.click(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-primary hover:bg-white/5 rounded-xl">
                                <ImageIcon size={18} className="text-theme-brand" />
                                <span className="font-bold">{t('attachImage')}</span>
                                <input type="file" accept="image/*" onChange={(e) => { setShowScanOptions(false); handleFileSelect(e); }} className="hidden" id="gallery-input-footer" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Row 2: Commissions (if applicable) */}
            {(type === TransactionType.TRANSFER || type === TransactionType.EXPENSE) && (
                <div className="hidden" /> /* Replaced by new compact version above Amount */
            )}

        {/* Metadata Slider (Horizontal) */}
        <div className="flex overflow-x-auto no-scrollbar gap-3 mb-2 px-2 py-1 scroll-smooth">

            {/* Wallet Selection */}
            {(() => {
                const fromAcc = accounts.find(a => a.id === fromAccountId) || accounts[0];
                const toAcc = accounts.find(a => a.id === toAccountId) || (accounts.length > 1 ? accounts[1] : accounts[0]);
                
                if (type === TransactionType.TRANSFER) {
                    return (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Source Wallet */}
                            <button
                                onClick={() => setShowAccountSelector('FROM')}
                                className="flex-shrink-0 bg-theme-surface rounded-2xl p-2 flex items-center gap-3 active:scale-[0.98] transition-all min-w-[140px] border border-theme-brand/20 shadow-lg shadow-brand/5"
                            >
                                <div className="text-theme-brand bg-theme-brand/10 w-11 h-11 rounded-full flex items-center justify-center">
                                    {renderAccountIcon(fromAcc.icon, 18)}
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-[8px] font-black text-theme-secondary underline decoration-theme-brand/30 uppercase tracking-widest">{t('source')}</span>
                                    <span className="text-[13px] font-bold text-theme-primary truncate max-w-[70px]">{fromAcc.name}</span>
                                </div>
                            </button>

                             <button
                                onClick={() => {
                                    const prevFrom = fromAccountId;
                                    setFromAccountId(toAccountId);
                                    setToAccountId(prevFrom);
                                }}
                                title="Swap Wallets"
                                className="p-1.5 bg-theme-surface border border-white/10 rounded-full text-theme-secondary hover:text-theme-primary transition-all active:scale-90 active:rotate-180 duration-300 shadow-lg"
                            >
                                <ArrowRightLeft size={16} />
                            </button>

                            {/* Destination Wallet */}
                            <button
                                onClick={() => setShowAccountSelector('TO')}
                                className="flex-shrink-0 bg-theme-surface rounded-2xl p-2 flex items-center gap-3 active:scale-[0.98] transition-all min-w-[140px] border border-blue-500/20 shadow-lg shadow-blue-500/5 animate-in slide-in-from-left-2 duration-300"
                            >
                                <div className="text-blue-400 bg-blue-400/10 w-11 h-11 rounded-full flex items-center justify-center">
                                    {renderAccountIcon(toAcc.icon, 18)}
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-[8px] font-black text-theme-secondary underline decoration-blue-500/30 uppercase tracking-widest">{t('target')}</span>
                                    <span className="text-[13px] font-bold text-theme-primary truncate max-w-[70px]">{toAcc.name}</span>
                                </div>
                            </button>
                        </div>
                    );
                }

                return (
                    <button
                        onClick={() => setShowAccountSelector('FROM')}
                        className="flex-shrink-0 bg-theme-surface rounded-2xl p-2 flex items-center gap-3 active:scale-[0.98] transition-all min-w-[140px] border border-white/5"
                    >
                        <div className="text-theme-brand bg-theme-brand/10 w-11 h-11 rounded-full flex items-center justify-center shadow-lg">
                            {renderAccountIcon(fromAcc.icon, 18)}
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-[8px] font-black text-theme-secondary underline decoration-theme-brand/30 uppercase tracking-widest">{t('wallet')}</span>
                            <span className="text-[13px] font-bold text-theme-primary truncate max-w-[70px]">{fromAcc.name}</span>
                        </div>
                    </button>
                );
            })()}

            {/* Category Button */}
            <button 
                onClick={() => setShowCategoryModal(true)}
                className="flex-shrink-0 bg-theme-surface rounded-2xl p-2 flex items-center gap-3 active:scale-[0.98] transition-all min-w-[140px] border border-white/5"
            >
                <div className={`${CATEGORIES.find(c => c.id === categoryId)?.color || 'text-theme-primary'} bg-white/5 w-11 h-11 rounded-full flex items-center justify-center shadow-lg`}>
                    {CATEGORIES.find(c => c.id === categoryId)?.icon}
                </div>
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[8px] font-black text-theme-secondary underline decoration-theme-brand/30 uppercase tracking-widest">{t('category')}</span>
                    <span className="text-[13px] font-bold text-theme-primary truncate max-w-[70px]">
                        {t(CATEGORIES.find(c => c.id === categoryId)?.name) || CATEGORIES.find(c => c.id === categoryId)?.name}
                    </span>
                </div>
            </button>

            {/* Date Button */}
            <div className="flex-shrink-0 relative group min-w-[140px]">
                <input 
                    ref={dateInputRef}
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    style={{ position: 'absolute' }}
                />
                <button 
                  onClick={() => {
                    if (dateInputRef.current) {
                        try {
                            if ('showPicker' in HTMLInputElement.prototype) {
                                (dateInputRef.current as any).showPicker();
                            } else {
                                dateInputRef.current.click();
                            }
                        } catch (e) {
                            dateInputRef.current.click();
                        }
                    }
                  }}
                  className="w-full h-full bg-theme-surface rounded-2xl p-2 flex items-center gap-3 active:scale-[0.98] transition-all border border-white/5"
                >
                    <div className="text-theme-brand bg-theme-brand/10 w-11 h-11 rounded-full flex items-center justify-center shadow-lg">
                        <Calendar size={18} />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[8px] font-black text-theme-secondary underline decoration-theme-brand/30 uppercase tracking-widest">{t('date')}</span>
                        <span className="text-[13px] font-bold text-theme-primary">
                            {new Date(date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                        </span>
                    </div>
                </button>
            </div>

            {/* Fiscal Tag Button */}
            <button 
                onClick={() => {
                    if (type === TransactionType.TRANSFER) return;
                    const next: Record<string, any> = { 'NEUTRAL': type === TransactionType.INCOME ? 'TAXABLE_INCOME' : 'DEDUCTIBLE_EXPENSE', 'TAXABLE_INCOME': 'NEUTRAL', 'DEDUCTIBLE_EXPENSE': 'NEUTRAL' };
                    setFiscalTag(next[fiscalTag] || 'NEUTRAL');
                }}
                disabled={type === TransactionType.TRANSFER}
                className={`flex-shrink-0 bg-theme-surface rounded-2xl p-2.5 flex items-center gap-3 active:scale-[0.98] transition-all min-w-[140px] border border-white/5 ${type === TransactionType.TRANSFER ? 'opacity-30' : ''}`}
            >
                <div className={`${fiscalTag !== 'NEUTRAL' ? 'text-theme-brand bg-theme-brand/10' : 'text-theme-secondary bg-white/5'} w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-colors`}>
                    <Sparkles size={18} />
                </div>
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[8px] font-black text-theme-secondary underline decoration-theme-brand/30 uppercase tracking-widest">{t('fiscal')}</span>
                    <span className="text-[13px] font-bold text-theme-primary truncate max-w-[70px]">{t(fiscalTag.toLowerCase())}</span>
                </div>
            </button>

            {/* Budget Month Picker */}
            <div className="flex-shrink-0 relative min-w-[140px]">
                <button
                    ref={monthBtnRef}
                    onClick={() => {
                        if (monthBtnRef.current) {
                            const rect = monthBtnRef.current.getBoundingClientRect();
                            setMonthDropPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 180) });
                        }
                        setShowBudgetMonthPicker(!showBudgetMonthPicker);
                    }}
                    className="w-full bg-theme-surface rounded-2xl p-2 flex items-center gap-3 active:scale-[0.98] transition-all border border-white/5"
                >
                    <div className="text-theme-secondary bg-white/5 w-11 h-11 rounded-full flex items-center justify-center shadow-lg">
                        <ChevronDown size={18} className={`transition-transform duration-300 ${showBudgetMonthPicker ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="flex flex-col items-start leading-tight text-left">
                        <span className="text-[8px] font-black text-theme-secondary underline decoration-theme-brand/30 uppercase tracking-widest">{t('month')}</span>
                        <span className="text-[13px] font-bold text-theme-primary">
                            {budgetMonth
                                ? (() => { const [y,mo] = budgetMonth.split('-').map(Number); return new Date(y, mo-1).toLocaleDateString(undefined, {month:'short', year:'2-digit'}); })()
                                : t('current')
                            }
                        </span>
                    </div>
                </button>

                {showBudgetMonthPicker && monthDropPos && (
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setShowBudgetMonthPicker(false)} />
                        <div
                            className="fixed bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                            style={{ top: '113px', right: '22px', width: '170px', position: 'fixed' }}
                        >
                            <div className="max-h-[220px] overflow-y-auto no-scrollbar py-1">
                                <button
                                    onClick={() => { setBudgetMonth(''); setShowBudgetMonthPicker(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                        !budgetMonth ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:bg-white/5 hover:text-theme-primary'
                                    }`}
                                >
                                    {t('current')}
                                </button>
                                {(() => {
                                    const months = new Set<string>();
                                    const cur = new Date().toISOString().slice(0, 7);
                                    transactions.forEach(tx => months.add(tx.date.slice(0, 7)));
                                    budgets.forEach(b => { if(b.month) months.add(b.month); });
                                    if (months.size === 0) months.add(cur);
                                    return Array.from(months).sort().reverse().map(m => {
                                        const [y, mo] = m.split('-').map(Number);
                                        const label = new Date(y, mo - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                                        return (
                                            <button
                                                key={m}
                                                onClick={() => { setBudgetMonth(m); setShowBudgetMonthPicker(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-xs font-bold capitalize transition-colors ${
                                                    budgetMonth === m ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:bg-white/5 hover:text-theme-primary'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
        <div className="relative flex-1 flex flex-col">
          {isCalculatorMode && (
            <div className="bg-black absolute bottom-full left-0 right-0 flex justify-between gap-2 mb-2 p-1 pt-3 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {['/', '*', '-', '+'].map((op) => (
                <button
                  key={op}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handleKeyPress(op)}
                  className="flex-1 bg-theme-surface border border-white/10 text-theme-primary py-1 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center"
                >
                  {op === '*' ? '×' : op === '/' ? '÷' : op}
                </button>
              ))}
            </div>
          )}

          {/* Keypad — grows to fill available space */}
          <div className="flex-1 grid grid-cols-3 gap-2 px-1 pb-1 mb-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => handleKeyPress(num.toString())}
                className="text-2xl sm:text-lg font-bold text-theme-primary hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center bg-theme-surface rounded-lg w-full h-full"
              >
                {num}
              </button>
            ))}
            <button onPointerDown={(e) => e.preventDefault()} onClick={() => handleKeyPress('.')} className="text-2xl sm:text-lg font-bold text-theme-primary hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center bg-theme-surface rounded-lg w-full h-full">.</button>
            <button onPointerDown={(e) => e.preventDefault()} onClick={() => handleKeyPress('0')} className="text-2xl sm:text-lg font-bold text-theme-primary hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center bg-theme-surface rounded-lg w-full h-full">0</button>
            <button onPointerDown={(e) => e.preventDefault()} onClick={handleDelete} className="flex items-center justify-center text-theme-secondary hover:text-theme-primary active:scale-95 transition-all bg-theme-surface rounded-lg w-full h-full">
              <Delete size={28} />
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 px-2 pt-2">
            <div className="flex items-center gap-3 mt-1">
                <button 
                  onClick={() => setIsCalculatorMode(!isCalculatorMode)}
                  className={`p-4 rounded-3xl transition-colors ${isCalculatorMode ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface border border-white/5 text-theme-secondary'}`}
                >
                  <Calculator size={22} />
                </button>
                
                <button 
                  onClick={isCalculatorMode ? handleCalculate : handleSave}
                  className="flex-1 bg-theme-brand hover:brightness-110 active:scale-[0.98] text-white font-bold h-14 rounded-3xl shadow-xl shadow-brand/20 flex items-center justify-center gap-3 transition-all text-sm"
                >
                   {isCalculatorMode ? (
                     <span className="text-3xl">=</span>
                   ) : (
                     <>
                        <span className="uppercase tracking-widest">{t('save')}</span>
                        <Check size={24} />
                     </>
                   )}
                </button>
            </div>
         </div>
      </div>
      
       {/* Category Modal */}
       {showCategoryModal && (
        <div className="fixed inset-0 bg-theme-bg z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-theme-bg flex items-center justify-between">
                <button onClick={() => { setShowCategoryModal(false); setCategorySearch(''); }} className="p-2 -ml-2 text-theme-secondary hover:text-theme-primary transition-colors">
                    <X size={24}/>
                </button>
                <h2 className="text-xl font-bold text-theme-primary tracking-tight">{t('selectCategory')}</h2>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            <div className="p-4 bg-theme-bg">
                {/* Search Bar */}
                <div className="relative">
                    <input 
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder={t('search')}
                        className="w-full bg-theme-surface border border-white/10 rounded-3xl py-4 pl-12 pr-4 text-sm font-bold text-theme-primary placeholder:text-theme-secondary outline-none focus:border-theme-brand/50 transition-all shadow-inner"
                        autoFocus
                    />
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" />
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
            
            <div className="overflow-y-auto no-scrollbar p-4 flex-1">
                 <div className="flex flex-col gap-4 pb-10">
                     {CATEGORIES.filter(cat => {
                         if (type === TransactionType.TRANSFER) return cat.id === 'transfer';
                         if (type === TransactionType.INCOME && !['income', 'work', 'freelance', 'business', 'interest', 'other', 'loans', 'charity', 'gift'].includes(cat.id)) return false;
                         if (type === TransactionType.EXPENSE && ['income', 'work', 'freelance', 'business', 'interest'].includes(cat.id)) return false;
                         if (type !== TransactionType.TRANSFER && cat.id === 'transfer') return false;
                         
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
                                     className={`w-full flex items-center gap-3 mb-3 p-2 rounded-2xl transition-colors ${categoryId === cat.id ? 'bg-theme-brand/10 text-theme-brand' : 'hover:bg-white/5'}`}
                                 >
                                     <div className={`p-2 rounded-2xl ${cat.color} bg-opacity-20`}>
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
                                                 className="px-3 py-1.5 bg-theme-bg/50 border border-white/5 rounded-2xl text-xs font-medium text-theme-secondary hover:bg-white/10 hover:text-theme-primary transition-colors capitalize"
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

       {/* Manual Selection / Crop Modal */}
       {showCropModal && selectedImage && (
           <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col p-4 pb-[100px] animate-in fade-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="text-white font-bold text-sm uppercase tracking-widest">{t('selectTotalSection')}</h3>
                   <button onClick={() => { setShowCropModal(false); setSelectedImage(null); }} className="p-2 bg-white/10 rounded-2xl text-white">
                       <X size={20} />
                   </button>
               </div>
               
               <div className="flex-1 min-h-0 relative overflow-hidden bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 p-4">
                 <div className="relative inline-flex max-w-full max-h-full items-center justify-center">
                   <img 
                        ref={imgRef}
                        src={selectedImage} 
                        className="max-w-full max-h-full object-contain pointer-events-none" 
                        alt="Crop Preview" 
                   />
                   
                   {/* Selection Overlay */}
                   <div 
                        className="absolute border-2 border-theme-soft shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move rounded-2xl"
                        style={{
                            left: `${cropBox.x}%`,
                            top: `${cropBox.y}%`,
                            width: `${cropBox.width}%`,
                            height: `${cropBox.height}%`
                        }}
                        onTouchStart={(e) => {
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startY = touch.clientY;
                            const initialX = cropBox.x;
                            const initialY = cropBox.y;
                            
                            const onMove = (moveEvent: TouchEvent) => {
                                const moveTouch = moveEvent.touches[0];
                                const dx = ((moveTouch.clientX - startX) / window.innerWidth) * 100;
                                const dy = ((moveTouch.clientY - startY) / window.innerHeight) * 100;
                                setCropBox(prev => ({
                                    ...prev,
                                    x: Math.max(0, Math.min(100 - prev.width, initialX + dx)),
                                    y: Math.max(0, Math.min(100 - prev.height, initialY + dy))
                                }));
                            };
                            
                            const onEnd = () => {
                                window.removeEventListener('touchmove', onMove);
                                window.removeEventListener('touchend', onEnd);
                            };
                            
                            window.addEventListener('touchmove', onMove);
                            window.addEventListener('touchend', onEnd);
                        }}
                        onMouseDown={(e) => {
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const initialX = cropBox.x;
                            const initialY = cropBox.y;
                            
                            const onMove = (moveEvent: MouseEvent) => {
                                const dx = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
                                const dy = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
                                setCropBox(prev => ({
                                    ...prev,
                                    x: Math.max(0, Math.min(100 - prev.width, initialX + dx)),
                                    y: Math.max(0, Math.min(100 - prev.height, initialY + dy))
                                }));
                            };
                            
                            const onEnd = () => {
                                window.removeEventListener('mousemove', onMove);
                                window.removeEventListener('mouseup', onEnd);
                            };
                            
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onEnd);
                        }}
                   >
                       <div className="absolute inset-0 border-2 border-white/30 rounded-2xl animate-pulse" />
                       <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-theme-brand/50 animate-scan-line" />
                       
                       {/* Resize Handles */}
                       {/* Top Left */}
                       <div 
                            className="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center cursor-nwse-resize"
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                const touch = e.touches[0];
                                const startX = touch.clientX;
                                const startY = touch.clientY;
                                const initialX = cropBox.x;
                                const initialY = cropBox.y;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: TouchEvent) => {
                                    const moveTouch = moveEvent.touches[0];
                                    const dx = ((moveTouch.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dy = ((moveTouch.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => {
                                        const newX = Math.max(0, Math.min(initialX + initialW - 10, initialX + dx));
                                        const newY = Math.max(0, Math.min(initialY + initialH - 5, initialY + dy));
                                        return {
                                            ...prev,
                                            x: newX,
                                            y: newY,
                                            width: initialX + initialW - newX,
                                            height: initialY + initialH - newY
                                        };
                                    });
                                };
                                const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
                                window.addEventListener('touchmove', onMove); window.addEventListener('touchend', onEnd);
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const initialX = cropBox.x;
                                const initialY = cropBox.y;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: MouseEvent) => {
                                    const dx = ((moveEvent.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dy = ((moveEvent.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => {
                                        const newX = Math.max(0, Math.min(initialX + initialW - 10, initialX + dx));
                                        const newY = Math.max(0, Math.min(initialY + initialH - 5, initialY + dy));
                                        return {
                                            ...prev,
                                            x: newX,
                                            y: newY,
                                            width: initialX + initialW - newX,
                                            height: initialY + initialH - newY
                                        };
                                    });
                                };
                                const onEnd = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd); };
                                window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
                            }}
                       >
                           <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                       </div>

                       {/* Top Right */}
                       <div 
                            className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center cursor-nesw-resize"
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                const touch = e.touches[0];
                                const startX = touch.clientX;
                                const startY = touch.clientY;
                                const initialY = cropBox.y;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: TouchEvent) => {
                                    const moveTouch = moveEvent.touches[0];
                                    const dx = ((moveTouch.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dy = ((moveTouch.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => {
                                        const newY = Math.max(0, Math.min(initialY + initialH - 5, initialY + dy));
                                        return {
                                            ...prev,
                                            y: newY,
                                            width: Math.max(10, Math.min(100 - prev.x, initialW + dx)),
                                            height: initialY + initialH - newY
                                        };
                                    });
                                };
                                const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
                                window.addEventListener('touchmove', onMove); window.addEventListener('touchend', onEnd);
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const initialY = cropBox.y;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: MouseEvent) => {
                                    const dx = ((moveEvent.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dy = ((moveEvent.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => {
                                        const newY = Math.max(0, Math.min(initialY + initialH - 5, initialY + dy));
                                        return {
                                            ...prev,
                                            y: newY,
                                            width: Math.max(10, Math.min(100 - prev.x, initialW + dx)),
                                            height: initialY + initialH - newY
                                        };
                                    });
                                };
                                const onEnd = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd); };
                                window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
                            }}
                       >
                           <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                       </div>

                       {/* Bottom Left */}
                       <div 
                            className="absolute -bottom-2 -left-2 w-6 h-6 flex items-center justify-center cursor-nesw-resize"
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                const touch = e.touches[0];
                                const startX = touch.clientX;
                                const startY = touch.clientY;
                                const initialX = cropBox.x;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: TouchEvent) => {
                                    const moveTouch = moveEvent.touches[0];
                                    const dx = ((moveTouch.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dy = ((moveTouch.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => {
                                        const newX = Math.max(0, Math.min(initialX + initialW - 10, initialX + dx));
                                        return {
                                            ...prev,
                                            x: newX,
                                            width: initialX + initialW - newX,
                                            height: Math.max(5, Math.min(100 - prev.y, initialH + dy))
                                        };
                                    });
                                };
                                const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
                                window.addEventListener('touchmove', onMove); window.addEventListener('touchend', onEnd);
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const initialX = cropBox.x;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: MouseEvent) => {
                                    const dx = ((moveEvent.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dy = ((moveEvent.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => {
                                        const newX = Math.max(0, Math.min(initialX + initialW - 10, initialX + dx));
                                        return {
                                            ...prev,
                                            x: newX,
                                            width: initialX + initialW - newX,
                                            height: Math.max(5, Math.min(100 - prev.y, initialH + dy))
                                        };
                                    });
                                };
                                const onEnd = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd); };
                                window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
                            }}
                       >
                           <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                       </div>

                       {/* Bottom Right */}
                       <div 
                            className="absolute -bottom-2 -right-2 w-6 h-6 flex items-center justify-center cursor-nwse-resize"
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                const touch = e.touches[0];
                                const startX = touch.clientX;
                                const startY = touch.clientY;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: TouchEvent) => {
                                    const moveTouch = moveEvent.touches[0];
                                    const dw = ((moveTouch.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dh = ((moveTouch.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => ({
                                        ...prev,
                                        width: Math.max(10, Math.min(100 - prev.x, initialW + dw)),
                                        height: Math.max(5, Math.min(100 - prev.y, initialH + dh))
                                    }));
                                };
                                const onEnd = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
                                window.addEventListener('touchmove', onMove); window.addEventListener('touchend', onEnd);
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const initialW = cropBox.width;
                                const initialH = cropBox.height;
                                
                                const onMove = (moveEvent: MouseEvent) => {
                                    const dw = ((moveEvent.clientX - startX) / (imgRef.current?.clientWidth || window.innerWidth)) * 100;
                                    const dh = ((moveEvent.clientY - startY) / (imgRef.current?.clientHeight || window.innerHeight)) * 100;
                                    setCropBox(prev => ({
                                        ...prev,
                                        width: Math.max(10, Math.min(100 - prev.x, initialW + dw)),
                                        height: Math.max(5, Math.min(100 - prev.y, initialH + dh))
                                    }));
                                };
                                const onEnd = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd); };
                                window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
                            }}
                       >
                           <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                       </div>
                   </div>
                 </div>
               </div>

                <div className="mt-4 flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setShowCropModal(false); setSelectedImage(null); }}
                            className="flex-1 py-4 bg-white/5 text-theme-secondary font-bold rounded-2xl hover:bg-white/10 transition-colors uppercase text-[10px]"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={() => { 
                                if (selectedImage) setReceiptImage(selectedImage);
                                setShowCropModal(false);
                                setSelectedImage(null);
                            }}
                            className="flex-1 py-4 bg-white/10 text-theme-primary font-bold rounded-2xl hover:bg-white/20 transition-colors uppercase text-[10px]"
                        >
                            {t('addWithoutAnalysis')}
                        </button>
                    </div>
                    <button 
                         onClick={handleApplyCrop}
                         disabled={isScanning}
                         className="w-full py-4 bg-theme-brand text-white font-bold rounded-2xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all uppercase text-xs"
                    >
                        {isScanning ? (
                           <>
                                <Loader2 size={18} className="animate-spin text-theme-brand" />
                                <span className="text-xs font-bold text-theme-primary">{t('analyzing')}</span>
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                <span className="text-xs font-bold">{t('processSelection')}</span>
                            </>
                        )}
                    </button>
                </div>
           </div>
       )}
       {/* Custom Camera Modal */}
       {showCameraModal && (
           <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in duration-300">
               <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
                   <video 
                       ref={videoRef} 
                       autoPlay 
                       playsInline 
                       className="w-full h-full object-cover"
                   />
                   
                   {/* Camera UI Overlay */}
                   <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                       <div className="w-full flex justify-end">
                            {/* Top controls if needed */}
                       </div>
                       <div className="w-full flex justify-center pb-10">
                           <div className="w-16 h-16 border-2 border-white/30 rounded-lg pointer-events-none" />
                            <p className="absolute bottom-24 text-white/70 text-xs font-bold bg-black/50 px-3 py-1 rounded-full">
                                {t('tapToCapture')}
                            </p>
                       </div>
                   </div>
               </div>

               {/* Camera Controls */}
               <div className="bg-zinc-950 p-8 flex items-center justify-between border-t border-white/5 pb-12">
                   <button onClick={stopCamera} className="p-4 bg-white/5 text-zinc-400 rounded-full font-bold hover:bg-white/10 transition-colors">
                       <X size={24} />
                   </button>
                   
                   <button 
                       onClick={capturePhoto} 
                       className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all border-4 border-zinc-900 ring-2 ring-white"
                   >
                       <div className="w-16 h-16 bg-white rounded-full border-2 border-zinc-300" />
                   </button>

                   <div className="w-[56px]" /> {/* Spacer for symmetry */}
               </div>
           </div>
       )}
    </div>
  );
};
