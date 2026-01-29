import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDown, ArrowRight, Coins, DollarSign } from 'lucide-react';
import { Account, TransactionType, Language, Currency, Transaction } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';

interface TransferViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onBack: () => void;
  onTransfer: (data: any) => void;
  lang: Language;
  exchangeRate: number;
  displayInVES: boolean;
  onToggleDisplayCurrency: () => void;
}

export const TransferView: React.FC<TransferViewProps> = ({ accounts, transactions, onBack, onTransfer, lang, exchangeRate, displayInVES, onToggleDisplayCurrency }) => {
  const [fromId, setFromId] = useState(accounts[0].id);
  const [toId, setToId] = useState(accounts.length > 1 ? accounts[1].id : accounts[0].id);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('transfer');
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
      category: selectedCategory,
      note: `Transfer to ${toAccount?.name}`,
      date: new Date().toISOString()
    });
    onBack();
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-theme-primary">{t('transfer')}</h1>
        </div>
        <button 
            onClick={onToggleDisplayCurrency}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 transition-all font-black text-[10px] ${displayInVES ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
        >
            {displayInVES ? <Coins size={14} /> : <DollarSign size={14} />}
            <span className="hidden sm:inline">{displayInVES ? 'VES' : 'USD'}</span>
        </button>
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
      
      <div className="mt-6">
        <label className="text-xs text-zinc-500 mb-3 block uppercase tracking-wider px-1">{t('category')}</label>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[ { id: 'transfer', name: 'transfer', icon: <ArrowRight size={20} />, color: 'bg-indigo-500/20 text-indigo-400' }, ...CATEGORIES ].slice(0, 10).map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-2xl border transition-all ${selectedCategory === cat.id ? 'bg-theme-bg border-theme-brand scale-105 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                    <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                        {cat.icon}
                    </div>
                    <span className="text-[10px] font-bold text-center truncate w-full uppercase">{t(cat.name)}</span>
                </button>
            ))}
        </div>
      </div>

      <button 
        onClick={handleTransfer}
        className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/40 active:scale-95 transition-transform"
      >
        {t('transferNow')}
      </button>

      {/* Recent Transfers List */}
      <div className="mt-12 mb-20">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">{t('recentTransactions')}</h3>
          <div className="flex flex-col gap-3">
              {(() => {
                  const transfers = transactions?.filter((t: any) => t.type === TransactionType.TRANSFER).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5) || [];
                  
                  if (transfers.length === 0) {
                      return <div className="p-8 text-center text-zinc-600 text-sm border-2 border-dashed border-white/5 rounded-3xl">{t('noTransactions')}</div>;
                  }

                  return transfers.map((tx: any) => {
                      const fAcc = accounts.find(a => a.id === tx.accountId);
                      const tAcc = accounts.find(a => a.id === tx.toAccountId);
                      return (
                        <div key={tx.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                    <ArrowRight size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{fAcc?.name} → {tAcc?.name}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-indigo-400">{tx.originalCurrency === Currency.USD ? '$' : 'Bs.'} {tx.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-zinc-600 font-mono">
                                    {tx.originalCurrency === Currency.USD ? 'Bs.' : '$'} {(tx.originalCurrency === Currency.USD ? tx.amount * tx.exchangeRate : tx.amount / tx.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                </p>
                            </div>
                        </div>
                      );
                  });
              })()}
          </div>
      </div>
    </div>
  );
};