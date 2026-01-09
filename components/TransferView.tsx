import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDown, ArrowRight } from 'lucide-react';
import { Account, TransactionType, Language, Currency } from '../types';
import { getTranslation } from '../i18n';

interface TransferViewProps {
  accounts: Account[];
  onBack: () => void;
  onTransfer: (data: any) => void;
  lang: Language;
  exchangeRate: number;
}

export const TransferView: React.FC<TransferViewProps> = ({ accounts, onBack, onTransfer, lang, exchangeRate }) => {
  const [fromId, setFromId] = useState(accounts[0].id);
  const [toId, setToId] = useState(accounts.length > 1 ? accounts[1].id : accounts[0].id);
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const t = (key: any) => getTranslation(lang, key);

  const fromAccount = accounts.find(a => a.id === fromId);
  const toAccount = accounts.find(a => a.id === toId);

  // Cross-currency calc
  useEffect(() => {
    if (!amount || !fromAccount || !toAccount) {
        setConvertedAmount(null);
        return;
    }
    const val = parseFloat(amount);
    if (isNaN(val)) {
        setConvertedAmount(null);
        return;
    }

    if (fromAccount.currency === toAccount.currency) {
        setConvertedAmount(val);
        return;
    }

    // Simplified conversion logic focusing on USD <-> VES
    let res = val;
    
    // Convert TO USD base first (conceptual)
    let usdBase = val;
    if (fromAccount.currency === Currency.VES) usdBase = val / exchangeRate;
    
    // Convert FROM USD base to target
    if (toAccount.currency === Currency.VES) res = usdBase * exchangeRate;
    else if (toAccount.currency === Currency.USD) res = usdBase;
    else res = usdBase; // Treat EUR/USDT as 1:1 USD for now
    
    setConvertedAmount(res);
  }, [amount, fromId, toId, exchangeRate, accounts]);


  const handleTransfer = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || fromId === toId) return;

    onTransfer({
      amount: val,
      originalCurrency: fromAccount?.currency,
      exchangeRate: exchangeRate,
      type: TransactionType.TRANSFER,
      accountId: fromId,
      toAccountId: toId,
      category: 'transfer',
      note: `Transfer to ${toAccount?.name}`,
      date: new Date().toISOString()
    });
    onBack();
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold">{t('transfer')}</h1>
      </div>

      <div className="flex flex-col gap-4 relative">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-colors">
          <label className="text-xs text-zinc-500 mb-2 block">{t('from')}</label>
          <select 
            value={fromId} 
            onChange={(e) => setFromId(e.target.value)}
            className="w-full bg-transparent text-white outline-none font-bold text-lg"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-zinc-900">{acc.icon} {acc.name} ({acc.currency})</option>
            ))}
          </select>
          <div className="mt-1 text-xs text-zinc-500">Available: {fromAccount?.balance.toLocaleString()} {fromAccount?.currency}</div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center border-4 border-background z-10 shadow-lg shadow-indigo-500/20">
          <ArrowDown size={16} className="text-white" />
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-colors">
          <label className="text-xs text-zinc-500 mb-2 block">{t('to')}</label>
          <select 
            value={toId} 
            onChange={(e) => setToId(e.target.value)}
            className="w-full bg-transparent text-white outline-none font-bold text-lg"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-zinc-900">{acc.icon} {acc.name} ({acc.currency})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 bg-[#121212] p-6 rounded-3xl border border-white/5">
        <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider">{t('amount')}</label>
        <div className="flex items-baseline gap-2">
            <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-5xl font-bold text-white outline-none placeholder:text-zinc-700"
            />
            <span className="text-xl font-bold text-zinc-500">{fromAccount?.currency}</span>
        </div>
        
        {convertedAmount !== null && fromAccount?.currency !== toAccount?.currency && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-indigo-400">
                <ArrowRight size={16} />
                <span className="font-mono text-lg">
                    ≈ {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toAccount?.currency}
                </span>
            </div>
        )}
      </div>

      <button 
        onClick={handleTransfer}
        className="mt-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/40 active:scale-95 transition-transform"
      >
        {t('transferNow')}
      </button>
    </div>
  );
};