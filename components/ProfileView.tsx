import React, { useState } from 'react';
import { ArrowLeft, User, Globe, FileSpreadsheet } from 'lucide-react';
import { UserProfile, Language, Transaction, Account } from '../types';
import { getTranslation } from '../i18n';

interface ProfileViewProps {
  onBack: () => void;
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  transactions: Transaction[];
  accounts: Account[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, profile, onUpdateProfile, transactions, accounts }) => {
  const [name, setName] = useState(profile.name);
  const [lang, setLang] = useState<Language>(profile.language);
  const t = (key: any) => getTranslation(lang, key);

  const handleSave = () => {
    onUpdateProfile({ name, language: lang });
    onBack();
  };

  const handleExportCSV = () => {
      // Create CSV Headers
      const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Note', 'Exchange Rate', 'USD Equivalent'];
      
      // Create CSV Rows
      const rows = transactions.map(tx => {
          const accName = accounts.find(a => a.id === tx.accountId)?.name || 'Unknown';
          return [
              tx.id,
              new Date(tx.date).toLocaleDateString(),
              tx.type,
              tx.amount,
              tx.originalCurrency,
              tx.category,
              accName,
              `"${tx.note.replace(/"/g, '""')}"`, // Escape quotes
              tx.exchangeRate,
              tx.normalizedAmountUSD.toFixed(2)
          ].join(',');
      });

      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(',') + "\n" 
          + rows.join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `dualflow_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold">{t('profile')}</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold mb-4">
          {name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <label className="text-xs text-zinc-500 mb-2 block flex items-center gap-2">
            <User size={12} /> {t('username')}
          </label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
           <label className="text-xs text-zinc-500 mb-2 block flex items-center gap-2">
            <Globe size={12} /> {t('language')}
          </label>
           <div className="grid grid-cols-3 gap-2">
             {['en', 'es', 'pt'].map((l) => (
               <button
                 key={l}
                 onClick={() => setLang(l as Language)}
                 className={`p-3 rounded-xl border capitalize ${lang === l ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10'}`}
               >
                 {l === 'en' ? 'English' : l === 'es' ? 'Español' : 'Português'}
               </button>
             ))}
           </div>
        </div>

        <div>
            <label className="text-xs text-zinc-500 mb-2 block flex items-center gap-2">
                <FileSpreadsheet size={12} /> Export
            </label>
            <button 
                onClick={handleExportCSV}
                className="w-full p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-between transition-colors"
            >
                <span className="font-medium">{t('exportCsv')}</span>
                <FileSpreadsheet size={18} className="text-emerald-400" />
            </button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="mt-auto bg-white text-black font-bold py-4 rounded-xl"
      >
        {t('saveProfile')}
      </button>
    </div>
  );
};