import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { Account, Language, Currency } from '../types';
import { getTranslation } from '../i18n';

interface WalletViewProps {
  onBack: () => void;
  accounts: Account[];
  onUpdateAccounts: (accounts: Account[]) => void;
  lang: Language;
}

export const WalletView: React.FC<WalletViewProps> = ({ onBack, accounts, onUpdateAccounts, lang }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('👛');

  const startEdit = (acc?: Account) => {
      if (acc) {
          setEditingId(acc.id);
          setName(acc.name);
          setCurrency(acc.currency);
          setBalance(acc.balance.toString());
          setIcon(acc.icon);
      } else {
          setEditingId(null);
          setName('');
          setCurrency(Currency.USD);
          setBalance('0');
          setIcon('👛');
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
        <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold">{editingId ? 'Edit Wallet' : 'New Wallet'}</h1>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="flex flex-col gap-6">
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Name</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="My Wallet" />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Currency</label>
                    <div className="flex gap-2">
                        {[Currency.USD, Currency.EUR, Currency.VES, Currency.USDT].map(c => (
                            <button key={c} onClick={() => setCurrency(c)} className={`px-4 py-2 rounded-lg border ${currency === c ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10'}`}>{c}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Initial Balance</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none" value={balance} onChange={e => setBalance(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Icon</label>
                    <div className="flex gap-4 text-2xl">
                        {['💵','💳','🏦','💰','⚡','💎','👛'].map(i => (
                            <button key={i} onClick={() => setIcon(i)} className={`p-2 rounded-lg ${icon === i ? 'bg-white/20' : ''}`}>{i}</button>
                        ))}
                    </div>
                </div>
                <button onClick={handleSave} className="bg-indigo-600 text-white font-bold py-4 rounded-xl mt-4">Save Wallet</button>
            </div>
        </div>
      );
  }

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold">{t('wallet')}</h1>
        </div>
        <button onClick={() => startEdit()} className="p-2 bg-indigo-600 rounded-full text-white"><Plus size={20} /></button>
      </div>

      <div className="grid gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className={`bg-gradient-to-br ${acc.color || 'from-zinc-800 to-zinc-900'} border border-white/10 p-6 rounded-2xl relative overflow-hidden group`}>
             <div className="absolute top-0 right-0 p-3 opacity-10">
                <CreditCard size={120} />
             </div>
             
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-2xl border border-white/10">
                      {acc.icon}
                   </div>
                   <div className="flex gap-2">
                       <span className="bg-black/30 px-3 py-1 rounded-full text-xs font-bold font-mono text-white/80 border border-white/10">{acc.currency}</span>
                       <button onClick={() => startEdit(acc)} className="p-1.5 bg-black/30 rounded-full text-white/70 hover:text-white"><Edit2 size={12} /></button>
                       <button onClick={() => handleDelete(acc.id)} className="p-1.5 bg-black/30 rounded-full text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                   </div>
                </div>
                <p className="text-white/60 text-sm font-medium uppercase tracking-wider">{acc.name}</p>
                <h3 className="text-3xl font-bold mt-1 text-white">{acc.balance.toLocaleString()}</h3>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};