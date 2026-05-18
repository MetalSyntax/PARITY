import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, ArrowUpRight, ArrowDownLeft, Plus, Check, ArrowLeft, X, ChevronDown, ChevronUp, Trash2, ArrowRightLeft, Wallet } from 'lucide-react';
import { Language, Currency, Transaction, TransactionType, Account } from '@parity/core';
import { getTranslation } from '@parity/i18n';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-red-500', 'bg-yellow-500', 'bg-cyan-500',
];

const CURRENCIES: Currency[] = [Currency.USD, Currency.VES, Currency.EUR, Currency.USDT];

const HANDLE_TYPES = ['zelle', 'binance_pay', 'pago_movil', 'bank', 'cash', 'other'] as const;
type HandleType = typeof HANDLE_TYPES[number];

interface PaymentHandle {
  type: HandleType;
  value: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  initials?: string;
  avatarColor: string;
  defaultCurrency: Currency;
  paymentHandles: PaymentHandle[];
  notes?: string;
  balance: number;
  direction: 'OWED_TO_YOU' | 'YOU_OWE' | 'SETTLED';
  createdAt: string;
}

interface ContactDirectoryViewProps {
  onBack: () => void;
  lang: Language;
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  transactions: Transaction[];
  exchangeRate: number;
  onQuickTransfer?: () => void;
  accounts?: Account[];
}

type FilterType = 'ALL' | 'YOU_OWE' | 'OWED_TO_YOU';

interface AddContactForm {
  name: string;
  email: string;
  amount: string;
  direction: 'OWED_TO_YOU' | 'YOU_OWE';
  avatarColor: string;
  defaultCurrency: Currency;
  notes: string;
  paymentHandles: PaymentHandle[];
}

const EMPTY_FORM: AddContactForm = {
  name: '',
  email: '',
  amount: '',
  direction: 'OWED_TO_YOU',
  avatarColor: AVATAR_COLORS[0],
  defaultCurrency: Currency.USD,
  notes: '',
  paymentHandles: [],
};

const HANDLE_TYPE_KEY: Record<HandleType, string> = {
  zelle: 'handleZelle',
  binance_pay: 'handleBinancePay',
  pago_movil: 'handlePagoMovil',
  bank: 'handleBank',
  cash: 'handleCash',
  other: 'handleOther',
};

function guessHandleType(account: Account): HandleType {
  const name = account.name.toLowerCase();
  if (name.includes('zelle')) return 'zelle';
  if (name.includes('binance') || account.currency === Currency.USDT) return 'binance_pay';
  if (name.includes('pago') || name.includes('movil') || name.includes('mobile')) return 'pago_movil';
  if (account.currency === Currency.VES) return 'pago_movil';
  if (name.includes('bank') || name.includes('banco') || name.includes('transfer')) return 'bank';
  if (name.includes('cash') || name.includes('efectivo') || name.includes('dinheiro')) return 'cash';
  return 'other';
}

export const ContactDirectoryView: React.FC<ContactDirectoryViewProps> = ({ lang, onBack, contacts, onUpdateContacts, transactions, exchangeRate, onQuickTransfer, accounts = [] }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddContactForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newHandleType, setNewHandleType] = useState<HandleType>('zelle');
  const [newHandleValue, setNewHandleValue] = useState('');

  // Compute transaction flow per contact
  const contactsWithFlow = contacts.map(c => {
    const linked = transactions.filter(tx => (tx as any).contactId === c.id);
    const income = linked.filter(tx => tx.type === TransactionType.INCOME).reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
    const expense = linked.filter(tx => tx.type === TransactionType.EXPENSE).reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
    const netFlow = income - expense;
    return { ...c, _netFlow: netFlow, _linkedCount: linked.length };
  });

  const totalOwedToYou = contacts.filter(c => c.direction === 'OWED_TO_YOU').reduce((s, c) => s + c.balance, 0);
  const totalYouOwe = contacts.filter(c => c.direction === 'YOU_OWE').reduce((s, c) => s + c.balance, 0);

  const filtered = contactsWithFlow.filter(c => {
    const matchFilter = filter === 'ALL' || c.direction === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openAdd = () => { setForm(EMPTY_FORM); setFormError(''); setNewHandleValue(''); setShowAdd(true); };
  const closeAdd = () => setShowAdd(false);

  const addHandle = () => {
    if (!newHandleValue.trim()) return;
    setForm(f => ({ ...f, paymentHandles: [...f.paymentHandles, { type: newHandleType, value: newHandleValue.trim() }] }));
    setNewHandleValue('');
  };

  const removeHandle = (idx: number) => {
    setForm(f => ({ ...f, paymentHandles: f.paymentHandles.filter((_, i) => i !== idx) }));
  };

  const saveContact = () => {
    if (!form.name.trim()) { setFormError(`${t('name')} ${t('fieldRequired')}`); return; }
    const amount = parseFloat(form.amount) || 0;
    const initials = form.name.trim().split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const newContact: Contact = {
      id: Date.now().toString(),
      name: form.name.trim(),
      email: form.email.trim(),
      initials,
      avatarColor: form.avatarColor,
      defaultCurrency: form.defaultCurrency,
      paymentHandles: form.paymentHandles,
      notes: form.notes.trim() || undefined,
      balance: amount,
      direction: amount === 0 ? 'SETTLED' : form.direction,
      createdAt: new Date().toISOString(),
    } as any;
    onUpdateContacts([...contacts, newContact]);
    closeAdd();
  };

  const deleteContact = (id: string) => {
    onUpdateContacts(contacts.filter(c => c.id !== id));
    setSelectedId(null);
  };

  const markSettled = (id: string) => {
    onUpdateContacts(contacts.map(c => c.id === id ? { ...c, balance: 0, direction: 'SETTLED' } : c));
  };

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-theme-primary">{t('contacts')}</h1>
          <p className="text-sm text-theme-secondary opacity-60">{t('contactsSubtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSearch(s => !s)}
          className={`w-10 h-10 rounded-2xl border border-white/5 flex items-center justify-center transition-all ${showSearch ? 'bg-theme-brand text-white' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
        >
          <Search size={16} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={openAdd}
          className="w-12 h-12 bg-theme-brand rounded-2xl text-white shadow-lg shadow-brand/20 flex items-center justify-center"
        >
          <Plus size={22} />
        </motion.button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mb-4">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search')}
              className="w-full bg-theme-surface border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/50 outline-none focus:border-theme-brand/40"
            />
          </motion.div>
        )}
      </AnimatePresence>

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
            <p className="text-sm font-bold text-theme-primary mb-1">{t('noContactsYet')}</p>
            <p className="text-xs text-theme-secondary opacity-60">{t('addContactHint')}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((contact: Contact, i: number) => (
            <div key={contact.id}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-theme-surface/50 border border-white/5 cursor-pointer group active:scale-[0.98] transition-all hover:bg-theme-surface ${selectedId === contact.id ? 'rounded-t-2xl border-b-0' : 'rounded-2xl'}`}
                onClick={() => setSelectedId(selectedId === contact.id ? null : contact.id)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                      <div className={`w-12 h-12 rounded-full ${contact.avatarColor} flex items-center justify-center font-black text-base text-white`}>
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
                      <p className="text-[11px] text-theme-secondary">{contact.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    {selectedId === contact.id ? <ChevronUp size={14} className="text-theme-secondary" /> : <ChevronDown size={14} className="text-theme-secondary" />}
                  </div>
                </div>
              </motion.div>

              {/* Detail Panel */}
              <AnimatePresence>
                {selectedId === contact.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-theme-surface/30 border border-white/5 border-t-0 rounded-b-2xl px-4 pb-4 pt-3 space-y-3">
                      {/* Currency badge + payment handles */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded-full bg-theme-brand/10 border border-theme-brand/20 text-[10px] text-theme-brand font-black">{contact.defaultCurrency}</span>
                        {contact.paymentHandles.map((h, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-full bg-theme-surface border border-white/10 text-[10px] text-theme-secondary font-bold">
                            <span className="text-theme-primary">{t(HANDLE_TYPE_KEY[h.type as HandleType] || h.type)}</span>: {h.value}
                          </span>
                        ))}
                        {contact.paymentHandles.length === 0 && (
                          <span className="text-[10px] text-theme-secondary opacity-50">{t('paymentHandles')}: —</span>
                        )}
                      </div>

                      {/* Notes */}
                      {contact.notes && (
                        <p className="text-[11px] text-theme-secondary italic">"{contact.notes}"</p>
                      )}

                      {/* Added date */}
                      <p className="text-[10px] text-theme-secondary opacity-40">{t('createdAt')}: {new Date(contact.createdAt).toLocaleDateString()}</p>

                      {/* Transaction net flow */}
                      {(contact as any)._linkedCount > 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-theme-secondary bg-theme-surface/50 rounded-lg px-3 py-2">
                          <span>{(contact as any)._linkedCount} tx →</span>
                          <span className={(contact as any)._netFlow >= 0 ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                            {(contact as any)._netFlow >= 0 ? '+' : ''}${(contact as any)._netFlow.toFixed(2)}
                          </span>
                          <span>{t('contactNetFlow')}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        {contact.direction !== 'SETTLED' && (
                          <button
                            onClick={() => markSettled(contact.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-black hover:bg-emerald-500/10 transition-colors"
                          >
                            <Check size={12} /> {t('markAsSettled')}
                          </button>
                        )}
                        {onQuickTransfer && (
                          <button
                            onClick={onQuickTransfer}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-theme-brand/30 text-theme-brand text-xs font-black hover:bg-theme-brand/10 transition-colors"
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-black hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black text-theme-primary">{t('newContact')}</h3>
                <button onClick={closeAdd} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Avatar Color */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-2 block">{t('avatarColor')}</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setForm(f => ({ ...f, avatarColor: color }))}
                        className={`w-8 h-8 rounded-full ${color} transition-all ${form.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-theme-surface scale-110' : 'opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('name')}</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => { setForm((f: AddContactForm) => ({ ...f, name: e.target.value })); setFormError(''); }}
                    placeholder={t('namePlaceholder')}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('contactEmail')}</label>
                  <input
                    value={form.email}
                    onChange={e => setForm((f: AddContactForm) => ({ ...f, email: e.target.value }))}
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('amount')} (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm((f: AddContactForm) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('currency')}</label>
                  <div className="flex gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, defaultCurrency: c }))}
                        className={`flex-1 py-2 rounded-xl border text-xs font-black transition-all ${form.defaultCurrency === c ? 'bg-theme-brand border-theme-brand text-white' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('direction')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setForm((f: AddContactForm) => ({ ...f, direction: 'OWED_TO_YOU' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${form.direction === 'OWED_TO_YOU' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <ArrowDownLeft size={14} /> {t('owedToYou')}
                    </button>
                    <button
                      onClick={() => setForm((f: AddContactForm) => ({ ...f, direction: 'YOU_OWE' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${form.direction === 'YOU_OWE' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <ArrowUpRight size={14} /> {t('youOwe')}
                    </button>
                  </div>
                </div>

                {/* Payment Handles */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('paymentHandles')}</label>

                  {/* Quick-add from wallets */}
                  {accounts.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[9px] text-theme-secondary/50 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                        <Wallet size={9} />{t('fromYourWallets')}
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {accounts.map(acc => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setNewHandleType(guessHandleType(acc));
                              setNewHandleValue(acc.name);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-theme-bg border border-white/10 text-[10px] text-theme-secondary hover:border-theme-brand/40 hover:text-theme-brand transition-all"
                          >
                            <span>{acc.icon}</span>
                            <span className="font-bold">{acc.name}</span>
                            <span className="text-theme-secondary/40">{acc.currency}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.paymentHandles.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-1.5">
                      <span className="flex-1 bg-theme-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-theme-secondary">
                        <span className="text-theme-brand font-bold">{t(HANDLE_TYPE_KEY[h.type])}</span>: {h.value}
                      </span>
                      <button onClick={() => removeHandle(idx)} className="text-theme-secondary hover:text-red-400 transition-colors p-1">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <select
                      value={newHandleType}
                      onChange={e => setNewHandleType(e.target.value as HandleType)}
                      className="bg-theme-bg border border-white/10 rounded-xl px-2 py-2 text-xs text-theme-secondary outline-none"
                    >
                      {HANDLE_TYPES.map(ht => <option key={ht} value={ht}>{t(HANDLE_TYPE_KEY[ht])}</option>)}
                    </select>
                    <input
                      value={newHandleValue}
                      onChange={e => setNewHandleValue(e.target.value)}
                      placeholder={t('handlePlaceholder')}
                      onKeyDown={e => e.key === 'Enter' && addHandle()}
                      className="flex-1 bg-theme-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                    />
                    <button
                      onClick={addHandle}
                      className="px-3 py-2 rounded-xl bg-theme-brand/10 border border-theme-brand/20 text-theme-brand text-xs font-black hover:bg-theme-brand/20 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('note')} {t('optional')}</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={t('notePlaceholder')}
                    rows={2}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50 resize-none"
                  />
                </div>

                {formError && <p className="text-xs text-red-400 font-bold">{formError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeAdd} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={saveContact} className="flex-1 py-3 rounded-2xl bg-theme-brand text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all">
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
