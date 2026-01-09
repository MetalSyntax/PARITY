import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, X, Edit2, Trash2, Wallet, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { Account, Language, Currency, Transaction, TransactionType } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';

interface WalletViewProps {
  onBack: () => void;
  accounts: Account[];
  onUpdateAccounts: (accounts: Account[]) => void;
  lang: Language;
  transactions: Transaction[];
}

export const WalletView: React.FC<WalletViewProps> = ({ onBack, accounts, onUpdateAccounts, lang, transactions }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('👛');
  const [payrollClient, setPayrollClient] = useState('');

  // Computations for "Income source & platform" style view
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthName = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });

  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const totalIncome = monthlyTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

  const totalExpense = monthlyTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);

  const netMonthly = totalIncome - totalExpense;

  // Mocking "Savings" and "Commissions" logic for now as they aren't explicit types yet
  // We can try to infer from categories if they exist, or just show 0 / Mock for visuals if requested "Justo como en la imagen"
  // Assuming 'savings' is a category, and 'fees' is commission.
  const savings = monthlyTransactions
      .filter(t => t.type === TransactionType.EXPENSE && (t.category === 'savings' || t.category === 'invest')) // Mock IDs
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
  
  // Commissions usually expenses? Or Income deductions? Let's assume expenses for 'fees'
  const commissions = monthlyTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category === 'fees')
      .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);


  // Active Sources (Income Categories with > 0 income this month)
  const activeSources = CATEGORIES
      .filter(cat => {
          const catIncome = monthlyTransactions
              .filter(t => t.type === TransactionType.INCOME && t.category === cat.id)
              .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
          return catIncome > 0;
      })
      .map(cat => {
           const catIncome = monthlyTransactions
              .filter(t => t.type === TransactionType.INCOME && t.category === cat.id)
              .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
           return { ...cat, total: catIncome };
      })
      .sort((a,b) => b.total - a.total);


  const startEdit = (acc?: Account) => {
      if (acc) {
          setEditingId(acc.id);
          setName(acc.name);
          setCurrency(acc.currency);
          setBalance(acc.balance.toString());
          setIcon(acc.icon);
          setPayrollClient(acc.payrollClient || '');
      } else {
          setEditingId(null);
          setName('');
          setCurrency(Currency.USD);
          setBalance('0');
          setIcon('👛');
          setPayrollClient('');
      }
      setIsEditing(true);
  };

  const handleSave = () => {
      if (!name) return;
      
      const newAccount: Account = {
          id: editingId || Math.random().toString(36).substr(2, 9),
          name,
          currency,
          balance: parseFloat(balance) || 0,
          icon,
          payrollClient,
          // Assign random gradient color if new
          color: editingId ? (accounts.find(a => a.id === editingId)?.color) : 'from-indigo-500 to-purple-600'
      };

      if (editingId) {
          onUpdateAccounts(accounts.map(a => a.id === editingId ? newAccount : a));
      } else {
          onUpdateAccounts([...accounts, newAccount]);
      }
      setIsEditing(false);
  };

  const handleDelete = (id: string) => {
      if (confirm('Delete this wallet? Transactions will remain but wallet will be gone.')) {
          onUpdateAccounts(accounts.filter(a => a.id !== id));
      }
  };

  if (isEditing) {
      return (
        <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto bg-theme-bg">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold text-theme-primary">{editingId ? 'Edit Wallet' : 'New Wallet'}</h1>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="flex flex-col gap-6">
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Name</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-theme-primary outline-none focus:border-theme-brand" value={name} onChange={e => setName(e.target.value)} placeholder="My Wallet" />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Currency</label>
                    <div className="flex gap-2">
                        {[Currency.USD, Currency.EUR, Currency.VES, Currency.USDT].map(c => (
                            <button key={c} onClick={() => setCurrency(c)} className={`px-4 py-2 rounded-lg border ${currency === c ? 'bg-theme-brand border-theme-brand text-white' : 'bg-white/5 border-white/10 text-theme-secondary'}`}>{c}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Initial Balance</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-theme-primary outline-none focus:border-theme-brand" value={balance} onChange={e => setBalance(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Icon</label>
                    <div className="flex gap-4 text-2xl overflow-x-auto no-scrollbar pb-2">
                        {['💵','💳','🏦','💰','⚡','💎','👛', '🏛️', '🪙'].map(i => (
                            <button key={i} onClick={() => setIcon(i)} className={`p-2 rounded-lg ${icon === i ? 'bg-white/20 scale-110' : ''} transition-all`}>{i}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Payroll Client Name (Optional)</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-theme-primary outline-none focus:border-theme-brand" value={payrollClient} onChange={e => setPayrollClient(e.target.value)} placeholder="e.g. Acme Corp" />
                </div>
                <button onClick={handleSave} className="bg-theme-brand text-white font-bold py-4 rounded-xl mt-4 shadow-lg hover:brightness-110 transition-all">Save Wallet</button>
            </div>
        </div>
      );
  }

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto bg-theme-bg overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
            <div>
                 <h1 className="text-xl font-bold text-theme-primary">Billeteras y Fuentes de Ingreso</h1>
                 <p className="text-xs text-theme-brand font-bold uppercase tracking-wider">{currentMonthName}</p>
            </div>
        </div>
        <button onClick={() => startEdit()} className="p-2 bg-theme-brand rounded-full text-white shadow-lg shadow-brand/20 hover:scale-105 transition-transform"><Plus size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 flex flex-col gap-8">
          
          {/* Active Sources Section */}
          <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                  <Layers size={14} className="text-theme-secondary" />
                  <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">Active Sources ({activeSources.length})</span>
              </div>
              
              {activeSources.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {activeSources.map(source => (
                        <div key={source.id} className="min-w-[140px] bg-theme-surface border border-white/5 p-4 rounded-2xl flex flex-col gap-3 group hover:border-theme-brand/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <span className="text-2xl filter drop-shadow-lg">{source.icon}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${source.color.includes('green') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                                    {Math.round((source.total / totalIncome) * 100)}%
                                </span>
                            </div>
                            <div>
                                <p className="text-theme-primary font-bold text-lg">${source.total.toLocaleString()}</p>
                                <p className="text-theme-secondary text-xs truncate">{source.name}</p>
                            </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center text-sm text-theme-secondary">
                      No active income sources this month.
                  </div>
              )}
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
              {/* Total Income Resume */}
              <div className="bg-theme-surface p-5 rounded-3xl border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                      <TrendingUp size={80} />
                  </div>
                  <p className="text-xs text-theme-secondary uppercase tracking-wider mb-2">Total Monthly Income</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mb-4">+${totalIncome.toLocaleString()}</h3>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                          <span className="text-theme-secondary">Savings (Est.)</span>
                          <span className="text-theme-primary font-bold">${savings.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[20%]" /> {/* Mock width or calculated */}
                      </div>
                      <div className="flex justify-between text-xs">
                          <span className="text-theme-secondary">Commissions</span>
                          <span className="text-red-400 font-bold">-${commissions.toLocaleString()}</span>
                      </div>
                  </div>
              </div>

              {/* Net Monthly */}
              <div className="bg-gradient-to-br from-theme-surface to-black p-5 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute bottom-0 right-0 p-4 opacity-5">
                      <Wallet size={80} />
                  </div>
                  <div>
                    <p className="text-xs text-theme-secondary uppercase tracking-wider mb-1">Total Net Monthly</p>
                    <p className="text-[10px] text-zinc-500 leading-tight">Income - Expenses</p>
                  </div>
                  <h3 className="text-3xl font-bold text-theme-primary mt-4">${netMonthly.toLocaleString()}</h3>
                  <div className={`text-xs font-bold mt-2 px-2 py-1 rounded-lg w-fit ${netMonthly >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {netMonthly >= 0 ? '+ Positive Flow' : '- Negative Flow'}
                  </div>
              </div>
          </div>

          {/* Wallets List */}
          <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                  <Wallet size={14} className="text-theme-secondary" />
                  <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">Your Wallets ({accounts.length})</span>
              </div>
              <div className="grid gap-4">
                {accounts.map(acc => {
                  const stripClass = acc.color ? `bg-gradient-to-b ${acc.color}` : 'bg-theme-brand';
                  return (
                  <div key={acc.id} className="bg-theme-surface p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:scale-[1.01] transition-all flex-shrink-0">
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${stripClass}`} />
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/5">
                                {acc.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-theme-primary">{acc.name}</h3>
                                {acc.payrollClient && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">{acc.payrollClient}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(acc)} className="p-2 bg-white/5 rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-white/10 transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(acc.id)} className="p-2 bg-white/5 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    </div>

                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <span className="text-theme-secondary text-xs font-medium">Available Balance</span>
                            <span className="bg-white/5 px-2 py-1 rounded-lg text-xs font-bold font-mono text-theme-secondary border border-white/5 w-fit">{acc.currency}</span>
                        </div>
                        <h3 className="text-3xl font-bold text-theme-primary">{acc.balance.toLocaleString()}</h3>
                    </div>
                  </div>
                )})}
              </div>
          </div>
      </div>
    </div>
  );
};