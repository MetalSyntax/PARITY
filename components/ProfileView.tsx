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
  onImportData: (data: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, profile, onUpdateProfile, transactions, accounts, onImportData }) => {
  const [name, setName] = useState(profile.name);
  const [lang, setLang] = useState<Language>(profile.language);
  const t = (key: any) => getTranslation(lang, key);

  const handleSave = () => {
    onUpdateProfile({ name, language: lang });
    onBack();
  };

  const handleExportCSV = () => {
      // Extended CSV Headers
      const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Note', 'Exchange Rate', 'USD Equivalent'];
      
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
              `"${tx.note.replace(/"/g, '""')}"`,
              tx.exchangeRate,
              tx.normalizedAmountUSD.toFixed(2)
          ].join(',');
      });

      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
      downloadFile(csvContent, `dualflow_transactions_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleBackupJSON = () => {
      const backup = {
          version: 3,
          date: new Date().toISOString(),
          userProfile: profile,
          accounts,
          transactions,
          // We can also backup exchange rate if needed, but not strictly 'user data' usually. Added anyway.
          exchangeRate: 1 // Placeholder as prop isn't here, but if main state passed it would be. 
          // Since we don't have all state here, we rely on what is passed. 
          // Actually, App passed 'accounts' and 'transactions'.
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
      downloadFile(dataStr, `dualflow_backup_${new Date().toISOString().split('T')[0]}.json`, 'text/json');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
      const link = document.createElement("a");
      link.setAttribute("href", content);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              onImportData(data);
          } catch (error) {
              alert("Failed to parse backup file.");
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 bg-theme-bg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-theme-primary">{t('profile')}</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-theme-brand to-purple-500 flex items-center justify-center text-4xl font-bold mb-4 text-white">
          {name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ... User Fields ... */}
        <div>
          <label className="text-xs text-theme-secondary mb-2 block flex items-center gap-2">
            <User size={12} /> {t('username')}
          </label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-theme-surface border border-white/10 rounded-xl p-4 text-theme-primary outline-none focus:border-theme-brand"
          />
        </div>

        <div>
           <label className="text-xs text-theme-secondary mb-2 block flex items-center gap-2">
            <Globe size={12} /> {t('language')}
          </label>
           <div className="grid grid-cols-3 gap-2">
             {['en', 'es', 'pt'].map((l) => (
               <button
                 key={l}
                 onClick={() => setLang(l as Language)}
                 className={`p-3 rounded-xl border capitalize transition-colors ${lang === l ? 'bg-theme-brand border-theme-brand text-white' : 'bg-theme-surface border-white/10 text-theme-secondary'}`}
               >
                 {l === 'en' ? 'English' : l === 'es' ? 'Español' : 'Português'}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={handleExportCSV}
                className="p-4 bg-theme-surface border border-white/10 hover:bg-white/5 rounded-xl flex flex-col items-center gap-2 transition-colors"
            >
                <FileSpreadsheet size={24} className="text-emerald-400" />
                <span className="text-xs font-bold text-theme-primary">Export Transactions (CSV)</span>
            </button>
             <button 
                onClick={handleBackupJSON}
                className="p-4 bg-theme-surface border border-white/10 hover:bg-white/5 rounded-xl flex flex-col items-center gap-2 transition-colors"
            >
                <FileSpreadsheet size={24} className="text-blue-400" />
                <span className="text-xs font-bold text-theme-primary">Full Backup (JSON)</span>
            </button>
        </div>

        <div>
             <label className="text-xs text-theme-secondary mb-2 block">Restore Data</label>
             <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-theme-secondary">Click to upload backup (.json)</span>
                </div>
                <input type="file" className="hidden" accept=".json" onChange={handleImportFile} />
             </label>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="mt-auto bg-theme-primary text-theme-bg font-bold py-4 rounded-xl"
      >
        {t('saveProfile')}
      </button>
    </div>
  );
};