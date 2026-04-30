import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, ArrowUpRight, ArrowDownLeft, Plus, Check, ArrowLeft } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n';

interface Contact {
  id: string;
  name: string;
  email: string;
  initials?: string;
  balance: number;
  direction: 'OWED_TO_YOU' | 'YOU_OWE' | 'SETTLED';
}

interface ContactDirectoryViewProps {
  onBack: () => void;
  lang: Language;
}

type FilterType = 'ALL' | 'YOU_OWE' | 'OWED_TO_YOU';

export const ContactDirectoryView: React.FC<ContactDirectoryViewProps> = ({ lang, onBack }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [contacts] = useState<Contact[]>([]);

  const totalOwedToYou = contacts.filter(c => c.direction === 'OWED_TO_YOU').reduce((s, c) => s + c.balance, 0);
  const totalYouOwe = contacts.filter(c => c.direction === 'YOU_OWE').reduce((s, c) => s + c.balance, 0);

  const filtered = contacts.filter(c => {
    const matchFilter = filter === 'ALL' || c.direction === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">

      {/* Top utility bar */}
      <div className="flex items-center justify-end mb-4 gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSearch(s => !s)}
          className={`w-9 h-9 rounded-2xl border border-white/5 flex items-center justify-center transition-all ${showSearch ? 'bg-theme-brand text-white' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
        >
          <Search size={15} />
        </motion.button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-theme-primary">{t('contacts')}</h1>
          <p className="text-sm text-theme-secondary opacity-60">{t('contactsSubtitle')}</p>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-theme-surface border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/50 outline-none focus:border-theme-brand/40"
          />
        </motion.div>
      )}

      {/* Network Balance Card */}
      <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-5 shadow-2xl">
        <h2 className="text-base font-black text-theme-primary mb-0.5">{t('networkBalance')}</h2>
        <p className="text-[11px] text-theme-secondary mb-4 font-medium">{t('networkBalanceDesc')}</p>
        <div className="flex gap-6">
          <div>
            <span className="text-[10px] text-theme-secondary mb-1 block font-black uppercase tracking-widest">{t('youOwe')}</span>
            <span className="text-2xl font-black text-red-400">${totalYouOwe.toFixed(2)}</span>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-theme-secondary mb-1 block font-black uppercase tracking-widest">{t('owedToYou')}</span>
            <span className="text-2xl font-black text-emerald-400">${totalOwedToYou.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {([
          ['ALL', t('allContacts'), <Users size={13} />],
          ['OWED_TO_YOU', t('owedToYou'), <ArrowDownLeft size={13} />],
          ['YOU_OWE', t('youOwe'), <ArrowUpRight size={13} />],
        ] as [FilterType, string, React.ReactNode][]).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border ${filter === id ? 'bg-theme-surface text-theme-primary border-white/20 shadow-inner' : 'bg-transparent text-theme-secondary border-transparent hover:border-white/10 hover:bg-theme-surface/50'}`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Contact List / Empty State */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center">
            <Users size={28} className="text-theme-secondary opacity-40" />
          </div>
          <div>
            <p className="text-sm font-bold text-theme-primary mb-1">{t('noContactsYet') || 'No contacts yet'}</p>
            <p className="text-xs text-theme-secondary opacity-60">{t('addContactHint') || 'Tap + to add your first contact'}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-theme-surface active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <div className="w-12 h-12 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center text-theme-secondary font-black text-base">
                    {(contact.initials || contact.name.slice(0, 2)).toUpperCase()}
                  </div>
                  {contact.direction === 'SETTLED' ? (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-theme-bg bg-emerald-500 flex items-center justify-center">
                      <Check size={7} className="text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-theme-bg ${contact.direction === 'OWED_TO_YOU' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-theme-primary group-hover:text-theme-brand transition-colors">{contact.name}</p>
                  <p className="text-[11px] text-theme-secondary">{contact.email}</p>
                </div>
              </div>
              <div className="text-right">
                {contact.direction === 'SETTLED' ? (
                  <>
                    <p className="text-sm font-bold text-theme-secondary">{t('settled')}</p>
                    <p className="text-[11px] text-theme-secondary">{t('noBalance')}</p>
                  </>
                ) : (
                  <>
                    <p className={`text-sm font-black ${contact.direction === 'OWED_TO_YOU' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {contact.direction === 'OWED_TO_YOU' ? '+' : '-'}${contact.balance.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-theme-secondary">
                      {contact.direction === 'OWED_TO_YOU' ? `${contact.name.split(' ')[0]} ${t('owesYou')}` : t('youOweLabel')}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-theme-brand flex items-center justify-center shadow-[0_0_20px_rgba(43,108,238,0.4)] z-40"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </div>
  );
};
