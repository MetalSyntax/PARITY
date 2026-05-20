import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, ArrowUpRight, ArrowDownLeft, Plus, Check, X,
  ChevronDown, ChevronUp, Trash2, Wallet, Pencil,
  Receipt, DollarSign, AlertCircle, ArrowLeft, UserCircle2,
} from 'lucide-react';
import { Language, Currency, Transaction, TransactionType, Account } from '@parity/core';
import { getTranslation } from '@parity/i18n';
import { CATEGORIES } from '../constants';
import { renderAccountIcon } from '../utils/iconUtils';

// ─── Shared constants ────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-red-500', 'bg-yellow-500', 'bg-cyan-500',
];

const CURRENCIES: Currency[] = [Currency.USD, Currency.VES, Currency.EUR, Currency.USDT];

const HANDLE_TYPES = ['zelle', 'binance_pay', 'pago_movil', 'bank', 'cash', 'other'] as const;
type HandleType = typeof HANDLE_TYPES[number];

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

// ─── Contact types ───────────────────────────────────────────────────────────

interface PaymentHandle { type: HandleType; value: string; }

interface Contact {
  id: string;
  name: string;
  email?: string;
  initials?: string;
  avatarColor: string;
  defaultCurrency: Currency;
  paymentHandles: PaymentHandle[];
  notes?: string;
  createdAt: string;
  // legacy fields (may exist in stored data but no longer set by UI)
  balance?: number;
  direction?: 'OWED_TO_YOU' | 'YOU_OWE' | 'SETTLED';
}

interface AddContactForm {
  name: string;
  email: string;
  avatarColor: string;
  defaultCurrency: Currency;
  notes: string;
  paymentHandles: PaymentHandle[];
}

const EMPTY_CONTACT_FORM: AddContactForm = {
  name: '', email: '',
  avatarColor: AVATAR_COLORS[0], defaultCurrency: Currency.USD,
  notes: '', paymentHandles: [],
};

type ContactFilter = 'ALL' | 'YOU_OWE' | 'OWED_TO_YOU' | 'SETTLED';

// ─── Debt/Split types ─────────────────────────────────────────────────────────

interface Split {
  id: string;
  name: string;
  category: string;
  amount: number;
  remaining: number;
  amountAtRateUSD: number;
  direction: 'OWED_TO_YOU' | 'YOU_OWE';
  status: 'active' | 'partial' | 'settled';
  dueDate?: string;
  createdAt: string;
  contactId?: string;
  currency?: Currency;
  walletId?: string;
}

interface AddSplitForm {
  name: string;
  category: string;
  amount: string;
  direction: 'OWED_TO_YOU' | 'YOU_OWE';
  dueDate: string;
  contactId: string;
  currency: Currency;
  walletId: string;
}

const EMPTY_SPLIT_FORM: AddSplitForm = {
  name: '', category: '', amount: '', direction: 'OWED_TO_YOU', dueDate: '',
  contactId: '', currency: Currency.USD, walletId: '',
};

type DebtTab = 'OWED_TO_YOU' | 'YOU_OWE';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PeopleViewProps {
  onBack: () => void;
  lang: Language;
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  debts: Split[];
  onUpdateDebts: (debts: Split[]) => void;
  transactions: Transaction[];
  exchangeRate: number;
  accounts: Account[];
  onQuickTransfer?: () => void;
  onAddPaymentTransaction?: (prefilled: Partial<Transaction>) => void;
  onCreateDirectTransaction?: (tx: Partial<Transaction>) => void;
  initialTab?: 'CONTACTS' | 'DEBTS';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PeopleView: React.FC<PeopleViewProps> = ({
  onBack, lang, contacts, onUpdateContacts,
  debts: externalDebts, onUpdateDebts,
  transactions, exchangeRate, accounts,
  onQuickTransfer, onAddPaymentTransaction, onCreateDirectTransaction,
  initialTab = 'CONTACTS',
}) => {
  const t = (key: any) => getTranslation(lang, key);

  const toUSD = (amount: number, currency: Currency): number => {
    if (currency === Currency.VES) return exchangeRate > 0 ? amount / exchangeRate : 0;
    return amount; // USD, USDT, EUR treated as USD-equivalent
  };

  const currencySymbol = (currency?: Currency) => {
    if (currency === Currency.VES) return 'Bs';
    if (currency === Currency.EUR) return '€';
    return '$';
  };

  const [activeTab, setActiveTab] = useState<'CONTACTS' | 'DEBTS'>(initialTab);

  // ── Contacts state ──────────────────────────────────────────────────────────
  const [contactFilter, setContactFilter] = useState<ContactFilter>('ALL');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState<AddContactForm>(EMPTY_CONTACT_FORM);
  const [contactFormError, setContactFormError] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [showHandlesDropdown, setShowHandlesDropdown] = useState(false);

  // ── Debts state ─────────────────────────────────────────────────────────────
  const [localSplits, setLocalSplits] = useState<Split[]>([]);
  const splits = externalDebts ?? localSplits;
  const setSplits = (updater: Split[] | ((prev: Split[]) => Split[])) => {
    const next = typeof updater === 'function' ? updater(splits) : updater;
    if (onUpdateDebts) onUpdateDebts(next);
    else setLocalSplits(next);
  };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddSplit, setShowAddSplit] = useState(false);
  const [editingSplitId, setEditingSplitId] = useState<string | null>(null);
  const [splitForm, setSplitForm] = useState<AddSplitForm>(EMPTY_SPLIT_FORM);
  const [splitFormError, setSplitFormError] = useState('');
  const [debtTab, setDebtTab] = useState<DebtTab>('OWED_TO_YOU');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  // Settlement modal
  const [settlingSplit, setSettlingSplit] = useState<Split | null>(null);
  const [settleWalletId, setSettleWalletId] = useState('');

  // ── Contacts computed ───────────────────────────────────────────────────────
  const getContactNetBalance = (contactId: string) => {
    const linked = splits.filter(s => s.contactId === contactId && s.status !== 'settled');
    const owedToYou = linked.filter(s => s.direction === 'OWED_TO_YOU').reduce((sum, s) => sum + toUSD(s.remaining, s.currency || Currency.USD), 0);
    const youOwe = linked.filter(s => s.direction === 'YOU_OWE').reduce((sum, s) => sum + toUSD(s.remaining, s.currency || Currency.USD), 0);
    return owedToYou - youOwe;
  };

  const getContactDirection = (netBalance: number): 'OWED_TO_YOU' | 'YOU_OWE' | 'SETTLED' => {
    if (netBalance > 0) return 'OWED_TO_YOU';
    if (netBalance < 0) return 'YOU_OWE';
    return 'SETTLED';
  };

  const contactsWithBalance = contacts.map(c => {
    const linked = transactions.filter(tx => (tx as any).contactId === c.id);
    const income = linked.filter(tx => tx.type === TransactionType.INCOME).reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
    const expense = linked.filter(tx => tx.type === TransactionType.EXPENSE).reduce((s, tx) => s + tx.normalizedAmountUSD, 0);
    const netBalance = getContactNetBalance(c.id);
    const direction = getContactDirection(netBalance);
    return { ...c, _netFlow: income - expense, _linkedCount: linked.length, _netBalance: netBalance, _direction: direction };
  });

  const totalOwedToYouContacts = splits.filter(s => s.direction === 'OWED_TO_YOU' && s.status !== 'settled').reduce((sum, s) => sum + toUSD(s.remaining, s.currency || Currency.USD), 0);
  const totalYouOweContacts = splits.filter(s => s.direction === 'YOU_OWE' && s.status !== 'settled').reduce((sum, s) => sum + toUSD(s.remaining, s.currency || Currency.USD), 0);

  const filteredContacts = contactsWithBalance.filter(c => {
    const matchFilter = contactFilter === 'ALL' || c._direction === contactFilter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // ── Debts computed ──────────────────────────────────────────────────────────
  const totalOwedToYouDebts = splits.filter(s => s.direction === 'OWED_TO_YOU' && s.status !== 'settled').reduce((sum, s) => sum + toUSD(s.remaining, s.currency || Currency.USD), 0);
  const totalYouOweDebts = splits.filter(s => s.direction === 'YOU_OWE' && s.status !== 'settled').reduce((sum, s) => sum + toUSD(s.remaining, s.currency || Currency.USD), 0);
  const settledCount = splits.filter(s => s.status === 'settled').length;
  const recoveryRate = splits.length > 0 ? Math.round((settledCount / splits.length) * 100) : 0;
  const visibleSplits = splits.filter(s => s.direction === debtTab);

  const getCategoryDisplay = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat ? { icon: cat.icon, label: t(cat.name) } : { icon: null, label: catId || t('general') };
  };

  const getDueDateBadge = (split: Split) => {
    if (!split.dueDate || split.status === 'settled') return null;
    const daysLeft = Math.ceil((new Date(split.dueDate).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return { label: t('overdue'), color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    if (daysLeft === 0) return { label: t('today'), color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { label: `${t('dueIn')} ${daysLeft}d`, color: 'text-theme-secondary bg-theme-surface/50 border-white/10' };
  };

  // ── Contacts handlers ───────────────────────────────────────────────────────
  const openAddContact = () => {
    setEditingContactId(null);
    setContactForm(EMPTY_CONTACT_FORM);
    setContactFormError('');
    setShowHandlesDropdown(false);
    setShowAddContact(true);
  };

  const openEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setContactForm({
      name: contact.name,
      email: contact.email || '',
      avatarColor: contact.avatarColor,
      defaultCurrency: contact.defaultCurrency,
      notes: contact.notes || '',
      paymentHandles: contact.paymentHandles,
    });
    setContactFormError('');
    setShowHandlesDropdown(false);
    setShowAddContact(true);
  };

  const toggleWalletHandle = (acc: Account) => {
    const alreadyAdded = contactForm.paymentHandles.some(h => h.value === acc.name);
    if (alreadyAdded) {
      setContactForm(f => ({ ...f, paymentHandles: f.paymentHandles.filter(h => h.value !== acc.name) }));
    } else {
      setContactForm(f => ({ ...f, paymentHandles: [...f.paymentHandles, { type: guessHandleType(acc), value: acc.name }] }));
    }
  };

  const saveContact = () => {
    if (!contactForm.name.trim()) { setContactFormError(`${t('name')} ${t('fieldRequired')}`); return; }
    const initials = contactForm.name.trim().split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    if (editingContactId) {
      onUpdateContacts(contacts.map(c => c.id === editingContactId ? {
        ...c,
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        initials,
        avatarColor: contactForm.avatarColor,
        defaultCurrency: contactForm.defaultCurrency,
        paymentHandles: contactForm.paymentHandles,
        notes: contactForm.notes.trim() || undefined,
      } as any : c));
    } else {
      onUpdateContacts([...contacts, {
        id: Date.now().toString(),
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        initials,
        avatarColor: contactForm.avatarColor,
        defaultCurrency: contactForm.defaultCurrency,
        paymentHandles: contactForm.paymentHandles,
        notes: contactForm.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      } as any]);
    }
    setEditingContactId(null);
    setShowAddContact(false);
  };

  const deleteContact = (id: string) => {
    onUpdateContacts(contacts.filter(c => c.id !== id));
    setSelectedContactId(null);
  };

  // ── Debts handlers ──────────────────────────────────────────────────────────
  const openAddSplit = () => {
    setEditingSplitId(null);
    setSplitForm({ ...EMPTY_SPLIT_FORM, direction: debtTab });
    setSplitFormError('');
    setShowCategoryDropdown(false);
    setShowContactPicker(false);
    setShowWalletPicker(false);
    setShowAddSplit(true);
  };

  const openEditSplit = (split: Split) => {
    setEditingSplitId(split.id);
    setSplitForm({
      name: split.name,
      category: split.category,
      amount: split.amount.toString(),
      direction: split.direction,
      dueDate: split.dueDate || '',
      contactId: split.contactId || '',
      currency: split.currency || Currency.USD,
      walletId: split.walletId || '',
    });
    setSplitFormError('');
    setShowCategoryDropdown(false);
    setShowContactPicker(false);
    setShowWalletPicker(false);
    setShowAddSplit(true);
  };

  const saveSplit = () => {
    if (!splitForm.name.trim()) { setSplitFormError(`${t('description')} ${t('fieldRequired')}`); return; }
    const amount = parseFloat(splitForm.amount) || 0;
    if (amount <= 0) { setSplitFormError(`${t('amount')} ${t('mustBePositive')}`); return; }

    const currency = splitForm.currency || Currency.USD;
    const amountUSD = toUSD(amount, currency);

    if (editingSplitId) {
      setSplits(prev => prev.map(s => {
        if (s.id !== editingSplitId) return s;
        const paid = s.amount - s.remaining;
        const newRemaining = Math.max(0, amount - paid);
        return {
          ...s,
          name: splitForm.name.trim(),
          category: splitForm.category || 'other',
          amount,
          remaining: newRemaining,
          amountAtRateUSD: amountUSD,
          direction: splitForm.direction,
          dueDate: splitForm.dueDate || undefined,
          status: newRemaining === 0 ? 'settled' : paid > 0 ? 'partial' : 'active',
          contactId: splitForm.contactId || undefined,
          currency,
          walletId: splitForm.walletId || undefined,
        };
      }));
    } else {
      const newSplit: any = {
        id: Date.now().toString(),
        name: splitForm.name.trim(),
        category: splitForm.category || 'other',
        amount,
        remaining: amount,
        amountAtRateUSD: amountUSD,
        direction: splitForm.direction,
        status: 'active',
        dueDate: splitForm.dueDate || undefined,
        createdAt: new Date().toISOString(),
        contactId: splitForm.contactId || undefined,
        currency,
        walletId: splitForm.walletId || undefined,
      };
      setSplits((prev: Split[]) => [...prev, newSplit]);

      // Auto-create transaction if wallet is selected
      if (splitForm.walletId && onCreateDirectTransaction) {
        onCreateDirectTransaction({
          id: `debt-${Date.now()}`,
          amount,
          originalCurrency: currency,
          exchangeRate,
          normalizedAmountUSD: amountUSD,
          // OWED_TO_YOU = you lent → EXPENSE from wallet; YOU_OWE = you received → INCOME to wallet
          type: splitForm.direction === 'OWED_TO_YOU' ? TransactionType.EXPENSE : TransactionType.INCOME,
          category: splitForm.direction === 'OWED_TO_YOU' ? 'other' : 'income',
          accountId: splitForm.walletId,
          note: splitForm.name.trim(),
          date: new Date().toISOString(),
        });
      }
    }
    setEditingSplitId(null);
    setShowAddSplit(false);
  };

  const handleAddPayment = (split: Split) => {
    if (!onAddPaymentTransaction || accounts.length === 0) return;
    const catId = CATEGORIES.find(c => c.id === split.category)?.id || (split.direction === 'OWED_TO_YOU' ? 'income' : 'other');
    const splitCurrency = split.currency || Currency.USD;
    onAddPaymentTransaction({
      id: '',
      amount: split.remaining,
      originalCurrency: splitCurrency,
      exchangeRate,
      normalizedAmountUSD: toUSD(split.remaining, splitCurrency),
      type: split.direction === 'OWED_TO_YOU' ? TransactionType.INCOME : TransactionType.EXPENSE,
      category: catId,
      accountId: accounts[0]?.id || '',
      note: split.name,
      date: new Date().toISOString(),
    } as any);
  };

  const markSplitSettled = (id: string) => {
    setSplits(prev => prev.map(s => s.id === id ? { ...s, remaining: 0, status: 'settled' } : s));
  };

  const openSettleModal = (split: Split) => {
    setSettlingSplit(split);
    setSettleWalletId(split.walletId || (accounts[0]?.id ?? ''));
  };

  const confirmSettle = () => {
    if (!settlingSplit) return;
    if (settleWalletId && onCreateDirectTransaction) {
      const settleCurrency = settlingSplit.currency || Currency.USD;
      onCreateDirectTransaction({
        id: `settle-${Date.now()}`,
        amount: settlingSplit.remaining,
        originalCurrency: settleCurrency,
        exchangeRate,
        normalizedAmountUSD: toUSD(settlingSplit.remaining, settleCurrency),
        // OWED_TO_YOU settled = they paid you → INCOME; YOU_OWE settled = you paid → EXPENSE
        type: settlingSplit.direction === 'OWED_TO_YOU' ? TransactionType.INCOME : TransactionType.EXPENSE,
        category: settlingSplit.direction === 'OWED_TO_YOU' ? 'income' : 'other',
        accountId: settleWalletId,
        note: settlingSplit.name,
        date: new Date().toISOString(),
      });
    }
    markSplitSettled(settlingSplit.id);
    setSettlingSplit(null);
    setSettleWalletId('');
  };

  const deleteSplit = (id: string) => {
    setSplits(prev => prev.filter(s => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const noAccounts = accounts.length === 0;

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-5">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-theme-primary">
            {activeTab === 'CONTACTS' ? t('contacts') : t('debtTracker')}
          </h1>
          <p className="text-sm text-theme-secondary opacity-60">
            {activeTab === 'CONTACTS' ? t('contactsSubtitle') : t('debtTrackerSubtitle')}
          </p>
        </div>
        {activeTab === 'CONTACTS' && (
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setShowSearch(s => !s)}
            className={`w-10 h-10 rounded-2xl border border-white/5 flex items-center justify-center transition-all ${showSearch ? 'bg-theme-brand text-white' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
          >
            <Search size={16} />
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={activeTab === 'CONTACTS' ? openAddContact : openAddSplit}
          className="w-12 h-12 bg-theme-brand rounded-2xl text-white shadow-lg shadow-brand/20 flex items-center justify-center"
        >
          <Plus size={22} />
        </motion.button>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-theme-surface rounded-2xl p-1 mb-5 border border-white/5">
        {([
          ['CONTACTS', t('contacts'), <Users size={13} />],
          ['DEBTS', t('debtTracker'), <Receipt size={13} />],
        ] as ['CONTACTS' | 'DEBTS', string, React.ReactNode][]).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === id ? 'bg-theme-bg text-theme-primary shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════ CONTACTS TAB ══════════════════════ */}
        {activeTab === 'CONTACTS' && (
          <motion.div key="contacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>

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

            {/* Network Balance Card — computed from debt tracker */}
            <div className="bg-theme-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-5 shadow-2xl">
              <h2 className="text-base font-black text-theme-primary mb-0.5">{t('networkBalance')}</h2>
              <p className="text-[11px] text-theme-secondary mb-4 font-medium">{t('balanceFromDebts') || 'Auto-calculated from Debt Tracker'}</p>
              <div className="flex gap-6">
                <div>
                  <span className="text-[10px] text-theme-secondary mb-1 block font-black uppercase tracking-widest">{t('youOwe')}</span>
                  <span className="text-2xl font-black text-red-400">${totalYouOweContacts.toFixed(2)}</span>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <span className="text-[10px] text-theme-secondary mb-1 block font-black uppercase tracking-widest">{t('owedToYou')}</span>
                  <span className="text-2xl font-black text-emerald-400">${totalOwedToYouContacts.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
              {([
                ['ALL', t('allContacts'), <Users size={13} />],
                ['OWED_TO_YOU', t('owedToYou'), <ArrowDownLeft size={13} />],
                ['YOU_OWE', t('youOwe'), <ArrowUpRight size={13} />],
              ] as [ContactFilter, string, React.ReactNode][]).map(([id, label, icon]) => (
                <button
                  key={id}
                  onClick={() => setContactFilter(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border ${contactFilter === id ? 'bg-theme-surface text-theme-primary border-white/20 shadow-inner' : 'bg-transparent text-theme-secondary border-transparent hover:border-white/10 hover:bg-theme-surface/50'}`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* Contact List */}
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
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
                {filteredContacts.map((contact: any, i: number) => {
                  const netBalance = contact._netBalance as number;
                  const dir = contact._direction as 'OWED_TO_YOU' | 'YOU_OWE' | 'SETTLED';
                  return (
                    <div key={contact.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`bg-theme-surface/50 border border-white/5 cursor-pointer group active:scale-[0.98] transition-all hover:bg-theme-surface ${selectedContactId === contact.id ? 'rounded-t-2xl border-b-0' : 'rounded-2xl'}`}
                        onClick={() => setSelectedContactId(selectedContactId === contact.id ? null : contact.id)}
                      >
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12">
                              <div className={`w-12 h-12 rounded-full ${contact.avatarColor} flex items-center justify-center font-black text-base text-white`}>
                                {(contact.initials || contact.name.slice(0, 2)).toUpperCase()}
                              </div>
                              {dir === 'SETTLED' ? (
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-theme-bg bg-emerald-500 flex items-center justify-center">
                                  <Check size={7} className="text-white" strokeWidth={3} />
                                </div>
                              ) : (
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-theme-bg ${dir === 'OWED_TO_YOU' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-black text-theme-primary group-hover:text-theme-brand transition-colors">{contact.name}</p>
                              <p className="text-[11px] text-theme-secondary">{contact.email || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              {dir === 'SETTLED' || netBalance === 0 ? (
                                <p className="text-sm font-bold text-theme-secondary">{t('noBalance')}</p>
                              ) : (
                                <>
                                  <p className={`text-sm font-black ${dir === 'OWED_TO_YOU' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {dir === 'OWED_TO_YOU' ? '+' : ''}${netBalance.toFixed(2)}
                                  </p>
                                  <p className="text-[11px] text-theme-secondary">
                                    {dir === 'OWED_TO_YOU' ? `${contact.name.split(' ')[0]} ${t('owesYou')}` : t('youOweLabel')}
                                  </p>
                                </>
                              )}
                            </div>
                            {selectedContactId === contact.id ? <ChevronUp size={14} className="text-theme-secondary" /> : <ChevronDown size={14} className="text-theme-secondary" />}
                          </div>
                        </div>
                      </motion.div>

                      {/* Contact detail panel */}
                      <AnimatePresence>
                        {selectedContactId === contact.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-theme-surface/30 border border-white/5 border-t-0 rounded-b-2xl px-4 pb-4 pt-3 space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 rounded-full bg-theme-brand/10 border border-theme-brand/20 text-[10px] text-theme-brand font-black">{contact.defaultCurrency}</span>
                                {contact.paymentHandles.map((h: PaymentHandle, idx: number) => (
                                  <span key={idx} className="px-2 py-1 rounded-full bg-theme-surface border border-white/10 text-[10px] text-theme-secondary font-bold">
                                    <span className="text-theme-primary">{t(HANDLE_TYPE_KEY[h.type as HandleType] || h.type)}</span>: {h.value}
                                  </span>
                                ))}
                                {contact.paymentHandles.length === 0 && (
                                  <span className="text-[10px] text-theme-secondary opacity-50">{t('paymentHandles')}: —</span>
                                )}
                              </div>
                              {contact.notes && <p className="text-[11px] text-theme-secondary italic">"{contact.notes}"</p>}
                              <p className="text-[10px] text-theme-secondary opacity-40">{t('createdAt')}: {new Date(contact.createdAt).toLocaleDateString()}</p>
                              {contact._linkedCount > 0 && (
                                <div className="flex items-center gap-2 text-[10px] text-theme-secondary bg-theme-surface/50 rounded-lg px-3 py-2">
                                  <span>{contact._linkedCount} tx →</span>
                                  <span className={contact._netFlow >= 0 ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                                    {contact._netFlow >= 0 ? '+' : ''}${contact._netFlow.toFixed(2)}
                                  </span>
                                  <span>{t('contactNetFlow')}</span>
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => openEditContact(contact)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-theme-brand/30 text-theme-brand text-xs font-black hover:bg-theme-brand/10 transition-colors"
                                >
                                  <Pencil size={12} /> {t('edit') || 'Edit'}
                                </button>
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
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════ DEBTS TAB ═════════════════════════ */}
        {activeTab === 'DEBTS' && (
          <motion.div key="debts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }} className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-square">
                <div className="w-10 h-10 rounded-full bg-theme-brand/10 border border-theme-brand/20 flex items-center justify-center text-theme-brand">
                  <ArrowDownLeft size={18} />
                </div>
                <div>
                  <p className="text-theme-secondary text-[11px] font-semibold mb-1">{t('totalOwedToYou')}</p>
                  <p className="text-xl font-black text-theme-primary">${totalOwedToYouDebts.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-square">
                <div className="w-10 h-10 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center text-theme-secondary">
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <p className="text-theme-secondary text-[11px] font-semibold mb-1">{t('totalYouOwe')}</p>
                  <p className="text-xl font-black text-theme-primary">${totalYouOweDebts.toFixed(2)}</p>
                </div>
              </div>
              <div className="col-span-2 bg-theme-surface/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-theme-secondary text-[11px] font-semibold mb-1">{t('monthlyRecoveryRate')}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-xl font-black text-theme-primary">{recoveryRate}%</p>
                    <p className="text-[11px] text-theme-secondary mb-0.5">{t('ofSplitsSettled')}</p>
                  </div>
                </div>
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgb(43,108,238)" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - recoveryRate / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Debt section tabs */}
            <div className="flex gap-2 bg-theme-surface rounded-2xl p-1 border border-white/5">
              {(['OWED_TO_YOU', 'YOU_OWE'] as DebtTab[]).map(tab => {
                const count = splits.filter(s => s.direction === tab && s.status !== 'settled').length;
                const isActive = debtTab === tab;
                const isOwed = tab === 'OWED_TO_YOU';
                return (
                  <button
                    key={tab}
                    onClick={() => setDebtTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${isActive ? 'bg-theme-bg text-theme-primary shadow-sm' : 'text-theme-secondary hover:text-theme-primary'}`}
                  >
                    {isOwed ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                    {isOwed ? t('theyOweMe') : t('iOwe')}
                    {count > 0 && (
                      <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${isOwed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Splits list */}
            {visibleSplits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-theme-surface border border-white/10 flex items-center justify-center">
                  <Receipt size={28} className="text-theme-secondary opacity-40" />
                </div>
                <div>
                  <p className="text-sm font-bold text-theme-primary mb-1">{t('noActiveSplits')}</p>
                  <p className="text-xs text-theme-secondary opacity-60">{t('addSplitHint')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleSplits.map(split => {
                  const badge = getDueDateBadge(split);
                  const paidPct = split.amount > 0 ? ((split.amount - split.remaining) / split.amount) * 100 : 0;
                  const catDisplay = getCategoryDisplay(split.category);
                  const linkedContact = split.contactId ? contacts.find(c => c.id === split.contactId) : null;
                  return (
                    <motion.div key={split.id} layout className="bg-theme-surface/50 border border-white/5 rounded-2xl overflow-hidden">
                      <button className="w-full p-4 text-left" onClick={() => setExpandedId(expandedId === split.id ? null : split.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${split.direction === 'OWED_TO_YOU' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {split.direction === 'OWED_TO_YOU' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-theme-primary">{split.name}</p>
                                {split.status === 'partial' && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black">{t('partial')}</span>
                                )}
                                {split.status === 'settled' && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black">{t('settled')}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {catDisplay.icon && <span className="text-[10px] opacity-60">{catDisplay.icon}</span>}
                                <p className="text-[11px] text-theme-secondary">{catDisplay.label}</p>
                                {split.currency && split.currency !== Currency.USD && (
                                  <span className="px-1 py-0.5 rounded bg-white/5 text-[9px] text-theme-secondary font-black">{split.currency}</span>
                                )}
                                {linkedContact && (
                                  <span className="flex items-center gap-0.5 text-[9px] text-theme-brand font-black">
                                    <UserCircle2 size={9} />{linkedContact.name.split(' ')[0]}
                                  </span>
                                )}
                                {badge && (
                                  <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-black ${badge.color}`}>{badge.label}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-base font-black ${split.direction === 'OWED_TO_YOU' ? 'text-theme-brand' : 'text-red-400'}`}>
                                {currencySymbol(split.currency)}{split.remaining.toFixed(2)}
                              </p>
                              <p className="text-[10px] uppercase tracking-widest text-theme-secondary font-black">{t('remaining')}</p>
                            </div>
                            {expandedId === split.id ? <ChevronUp size={14} className="text-theme-secondary" /> : <ChevronDown size={14} className="text-theme-secondary" />}
                          </div>
                        </div>
                        {split.status !== 'settled' && paidPct > 0 && (
                          <div className="mt-3 w-full bg-theme-surface/50 h-1 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${paidPct}%` }}
                              className={`h-full rounded-full ${split.direction === 'OWED_TO_YOU' ? 'bg-emerald-500' : 'bg-red-400'}`}
                            />
                          </div>
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedId === split.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0 border-t border-white/5">
                              <div className="flex gap-2 mt-3">
                                <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                                  <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">{t('total')}</p>
                                  <p className="text-sm font-black text-theme-primary">{currencySymbol(split.currency)}{split.amount.toFixed(2)}</p>
                                </div>
                                <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                                  <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">{t('remaining')}</p>
                                  <p className={`text-sm font-black ${split.direction === 'OWED_TO_YOU' ? 'text-emerald-400' : 'text-red-400'}`}>{currencySymbol(split.currency)}{split.remaining.toFixed(2)}</p>
                                </div>
                                <div className="flex-1 bg-theme-bg/50 rounded-xl p-3 text-center">
                                  <p className="text-[10px] text-theme-secondary font-black uppercase tracking-widest mb-1">{t('paid')}</p>
                                  <p className="text-sm font-black text-theme-primary">{currencySymbol(split.currency)}{(split.amount - split.remaining).toFixed(2)}</p>
                                </div>
                              </div>

                              {/* Linked contact info */}
                              {linkedContact && (
                                <div className="mt-3 flex items-center gap-2 bg-theme-bg/40 rounded-xl px-3 py-2">
                                  <div className={`w-6 h-6 rounded-full ${linkedContact.avatarColor} flex items-center justify-center text-[9px] font-black text-white flex-shrink-0`}>
                                    {(linkedContact.initials || linkedContact.name.slice(0, 2)).toUpperCase()}
                                  </div>
                                  <span className="text-[11px] text-theme-secondary">{t('linkedContact') || 'Contact'}: <span className="text-theme-primary font-bold">{linkedContact.name}</span></span>
                                </div>
                              )}

                              {/* Source wallet info */}
                              {split.walletId && (() => {
                                const wallet = accounts.find(a => a.id === split.walletId);
                                return wallet ? (
                                  <div className="mt-2 flex items-center gap-2 bg-theme-bg/40 rounded-xl px-3 py-2">
                                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-theme-secondary">
                                      {renderAccountIcon(wallet.icon, 13)}
                                    </span>
                                    <span className="text-[11px] text-theme-secondary">{t('sourceWallet') || 'Wallet'}: <span className="text-theme-primary font-bold">{wallet.name}</span></span>
                                  </div>
                                ) : null;
                              })()}

                              {exchangeRate > 1 && split.status !== 'settled' && (
                                <div className="mt-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 flex items-start gap-2">
                                  <AlertCircle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-black text-orange-400">{t('inflationGuard')}</p>
                                    <p className="text-[10px] text-theme-secondary">
                                      {t('originalValue')}: ${split.amountAtRateUSD.toFixed(2)} {split.currency !== Currency.VES ? `≈ Bs ${(split.amountAtRateUSD * exchangeRate).toFixed(0)}` : ''}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 mt-3 flex-wrap">
                                {split.status !== 'settled' && (
                                  <button
                                    onClick={() => handleAddPayment(split)}
                                    disabled={noAccounts || !onAddPaymentTransaction}
                                    title={noAccounts ? t('noWalletsAvailable') : undefined}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${noAccounts || !onAddPaymentTransaction ? 'border-white/5 text-theme-secondary/40 cursor-not-allowed' : 'border-theme-brand/30 text-theme-brand hover:bg-theme-brand/10'}`}
                                  >
                                    <DollarSign size={12} /> {t('addPayment')}
                                  </button>
                                )}
                                {split.status !== 'settled' && (
                                  <button
                                    onClick={() => openSettleModal(split)}
                                    className="flex-1 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-black hover:bg-emerald-500/10 transition-colors"
                                  >
                                    {t('markAsSettled')}
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditSplit(split)}
                                  className="px-3 py-2 rounded-xl border border-theme-brand/20 text-theme-brand text-xs font-black hover:bg-theme-brand/10 transition-colors"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => deleteSplit(split.id)}
                                  className="px-3 py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-black hover:bg-red-500/10 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>

                              {noAccounts && split.status !== 'settled' && (
                                <p className="text-[10px] text-theme-secondary/50 mt-2 text-center">{t('noWalletsAvailable')}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ MODALS ══════════════════════════════════════════════ */}

      {/* Add / Edit Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black text-theme-primary">{editingContactId ? t('editContact') || 'Edit Contact' : t('newContact')}</h3>
                <button onClick={() => { setEditingContactId(null); setShowAddContact(false); }} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
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
                        onClick={() => setContactForm(f => ({ ...f, avatarColor: color }))}
                        className={`w-8 h-8 rounded-full ${color} transition-all ${contactForm.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-theme-surface scale-110' : 'opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('name')}</label>
                  <input
                    autoFocus
                    value={contactForm.name}
                    onChange={e => { setContactForm(f => ({ ...f, name: e.target.value })); setContactFormError(''); }}
                    placeholder={t('namePlaceholder')}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('contactEmail')}</label>
                  <input
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('currency')}</label>
                  <div className="flex gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setContactForm(f => ({ ...f, defaultCurrency: c }))}
                        className={`flex-1 py-2 rounded-xl border text-xs font-black transition-all ${contactForm.defaultCurrency === c ? 'bg-theme-brand border-theme-brand text-white' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Handles — wallet dropdown */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('paymentHandles')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={accounts.length === 0}
                      onClick={() => setShowHandlesDropdown(s => !s)}
                      className={`w-full flex items-center gap-3 px-4 py-3 bg-theme-bg border rounded-2xl transition-all ${accounts.length === 0 ? 'border-white/5 opacity-40 cursor-not-allowed' : 'border-white/10 hover:border-white/20'}`}
                    >
                      {contactForm.paymentHandles.length > 0 ? (
                        <>
                          <span className="w-7 h-7 rounded-lg bg-theme-brand/10 border border-theme-brand/20 flex items-center justify-center text-theme-brand flex-shrink-0">
                            {renderAccountIcon(accounts.find(a => contactForm.paymentHandles.some(h => h.value === a.name))?.icon || 'wallet', 14)}
                          </span>
                          <span className="text-sm text-theme-primary font-bold flex-1 text-left truncate">
                            {contactForm.paymentHandles.map(h => h.value).join(', ')}
                          </span>
                          <span className="text-[10px] font-black text-theme-brand bg-theme-brand/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            {contactForm.paymentHandles.length}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-7 h-7 rounded-lg bg-theme-surface/50 border border-white/10 flex items-center justify-center text-theme-secondary flex-shrink-0">
                            <Wallet size={14} />
                          </span>
                          <span className="text-sm text-theme-secondary/50 flex-1 text-left">{t('paymentHandles')}</span>
                        </>
                      )}
                      <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 flex-shrink-0 ${showHandlesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showHandlesDropdown && accounts.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden"
                        >
                          <div className="max-h-56 overflow-y-auto no-scrollbar py-1">
                            {accounts.map(acc => {
                              const selected = contactForm.paymentHandles.some(h => h.value === acc.name);
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => toggleWalletHandle(acc)}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${selected ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-theme-brand/10 text-theme-brand' : 'bg-theme-surface text-theme-secondary'}`}>
                                    {renderAccountIcon(acc.icon, 13)}
                                  </span>
                                  <span className="flex-1 text-left truncate">{acc.name}</span>
                                  <span className="text-theme-secondary/40 font-normal text-[10px] flex-shrink-0">{acc.currency}</span>
                                  {selected && <Check size={12} className="ml-1 flex-shrink-0 text-theme-brand" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('note')} {t('optional')}</label>
                  <textarea
                    value={contactForm.notes}
                    onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={t('notePlaceholder')}
                    rows={2}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50 resize-none"
                  />
                </div>

                {contactFormError && <p className="text-xs text-red-400 font-bold">{contactFormError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setEditingContactId(null); setShowAddContact(false); }} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
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

      {/* Add / Edit Debt Modal */}
      <AnimatePresence>
        {showAddSplit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black text-theme-primary">{editingSplitId ? t('editDebt') || 'Edit Debt' : t('newSplit')}</h3>
                <button onClick={() => { setEditingSplitId(null); setShowAddSplit(false); }} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Description */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('description')}</label>
                  <input
                    autoFocus
                    value={splitForm.name}
                    onChange={e => { setSplitForm(f => ({ ...f, name: e.target.value })); setSplitFormError(''); }}
                    placeholder="Cena, Viaje, Crédito…"
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                {/* Contact picker (optional) */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('selectContact') || 'Contact'} <span className="opacity-50 normal-case font-normal">{t('optional')}</span></label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowContactPicker(s => !s); setShowCategoryDropdown(false); setShowWalletPicker(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-theme-bg border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                    >
                      {splitForm.contactId ? (() => {
                        const c = contacts.find(x => x.id === splitForm.contactId);
                        return c ? (
                          <>
                            <span className={`w-7 h-7 rounded-full ${c.avatarColor} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0`}>
                              {(c.initials || c.name.slice(0, 2)).toUpperCase()}
                            </span>
                            <span className="text-sm text-theme-primary font-bold flex-1 text-left truncate">{c.name}</span>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setSplitForm(f => ({ ...f, contactId: '' })); }}
                              className="text-theme-secondary hover:text-red-400 flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : null;
                      })() : (
                        <>
                          <span className="w-7 h-7 rounded-full bg-theme-surface/50 border border-white/10 flex items-center justify-center text-theme-secondary flex-shrink-0">
                            <UserCircle2 size={14} />
                          </span>
                          <span className="text-sm text-theme-secondary/50 flex-1 text-left">{t('noContactSelected') || 'No contact'}</span>
                          <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 flex-shrink-0 ${showContactPicker ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                    <AnimatePresence>
                      {showContactPicker && contacts.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden"
                        >
                          <div className="max-h-48 overflow-y-auto no-scrollbar py-1">
                            {contacts.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => { setSplitForm(f => ({ ...f, contactId: c.id })); setShowContactPicker(false); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${splitForm.contactId === c.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                              >
                                <span className={`w-6 h-6 rounded-full ${c.avatarColor} flex items-center justify-center text-[9px] font-black text-white flex-shrink-0`}>
                                  {(c.initials || c.name.slice(0, 2)).toUpperCase()}
                                </span>
                                <span className="flex-1 text-left truncate">{c.name}</span>
                                {splitForm.contactId === c.id && <Check size={12} className="ml-auto flex-shrink-0 text-theme-brand" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Category picker */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('category')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowCategoryDropdown(s => !s); setShowContactPicker(false); setShowWalletPicker(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-theme-bg border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                    >
                      {splitForm.category ? (() => {
                        const cat = CATEGORIES.find(c => c.id === splitForm.category);
                        return cat ? (
                          <>
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cat.color}`}>{cat.icon}</span>
                            <span className="text-sm text-theme-primary font-bold flex-1 text-left">{t(cat.name)}</span>
                          </>
                        ) : null;
                      })() : (
                        <>
                          <span className="w-7 h-7 rounded-lg bg-theme-surface/50 border border-white/10 flex-shrink-0" />
                          <span className="text-sm text-theme-secondary/50 flex-1 text-left">{t('category')}</span>
                        </>
                      )}
                      <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 flex-shrink-0 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showCategoryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden"
                        >
                          <div className="max-h-56 overflow-y-auto no-scrollbar py-1">
                            {CATEGORIES.filter(c => c.id !== 'transfer').map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => { setSplitForm(f => ({ ...f, category: cat.id })); setShowCategoryDropdown(false); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${splitForm.category === cat.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                              >
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] flex-shrink-0 ${cat.color}`}>{cat.icon}</span>
                                <span className="truncate">{t(cat.name)}</span>
                                {splitForm.category === cat.id && <Check size={12} className="ml-auto flex-shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('currency')}</label>
                  <div className="flex gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setSplitForm(f => ({ ...f, currency: c }))}
                        className={`flex-1 py-2 rounded-xl border text-xs font-black transition-all ${splitForm.currency === c ? 'bg-theme-brand border-theme-brand text-white' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('amount')} ({splitForm.currency})</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={splitForm.amount}
                    onChange={e => { setSplitForm(f => ({ ...f, amount: e.target.value })); setSplitFormError(''); }}
                    placeholder="0.00"
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-primary placeholder-theme-secondary/40 outline-none focus:border-theme-brand/50"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('dueDate')} {t('optional')}</label>
                  <input
                    type="date"
                    value={splitForm.dueDate}
                    onChange={e => setSplitForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-theme-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-theme-secondary outline-none focus:border-theme-brand/50"
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">{t('direction')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSplitForm(f => ({ ...f, direction: 'OWED_TO_YOU' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${splitForm.direction === 'OWED_TO_YOU' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <ArrowDownLeft size={14} /> {t('owedToYou')}
                    </button>
                    <button
                      onClick={() => setSplitForm(f => ({ ...f, direction: 'YOU_OWE' }))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-black transition-all ${splitForm.direction === 'YOU_OWE' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 text-theme-secondary hover:border-white/20'}`}
                    >
                      <ArrowUpRight size={14} /> {t('youOwe')}
                    </button>
                  </div>
                </div>

                {/* Source/Receive Wallet (optional) — auto-creates transaction */}
                {!editingSplitId && (
                  <div>
                    <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-1.5 block">
                      {splitForm.direction === 'OWED_TO_YOU' ? (t('sourceWallet') || 'Source Wallet') : (t('receiveWallet') || 'Receive Wallet')}
                      {' '}<span className="opacity-50 normal-case font-normal">{t('optional')}</span>
                    </label>
                    <p className="text-[10px] text-theme-secondary/60 mb-1.5">
                      {splitForm.direction === 'OWED_TO_YOU'
                        ? (t('sourceWalletHint') || 'Money left your wallet → auto-creates expense')
                        : (t('receiveWalletHint') || 'Money entered your wallet → auto-creates income')}
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={accounts.length === 0}
                        onClick={() => { setShowWalletPicker(s => !s); setShowCategoryDropdown(false); setShowContactPicker(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 bg-theme-bg border rounded-2xl transition-all ${accounts.length === 0 ? 'border-white/5 opacity-40 cursor-not-allowed' : 'border-white/10 hover:border-white/20'}`}
                      >
                        {splitForm.walletId ? (() => {
                          const acc = accounts.find(a => a.id === splitForm.walletId);
                          return acc ? (
                            <>
                              <span className="w-7 h-7 rounded-lg bg-theme-brand/10 border border-theme-brand/20 flex items-center justify-center text-theme-brand flex-shrink-0">
                                {renderAccountIcon(acc.icon, 14)}
                              </span>
                              <span className="text-sm text-theme-primary font-bold flex-1 text-left truncate">{acc.name}</span>
                              <span className="text-[10px] text-theme-brand font-black flex-shrink-0">{acc.currency}</span>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setSplitForm(f => ({ ...f, walletId: '' })); }}
                                className="text-theme-secondary hover:text-red-400 flex-shrink-0 ml-1"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : null;
                        })() : (
                          <>
                            <span className="w-7 h-7 rounded-lg bg-theme-surface/50 border border-white/10 flex items-center justify-center text-theme-secondary flex-shrink-0">
                              <Wallet size={14} />
                            </span>
                            <span className="text-sm text-theme-secondary/50 flex-1 text-left">{t('selectWallet') || 'Select wallet'}</span>
                            <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 flex-shrink-0 ${showWalletPicker ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>
                      <AnimatePresence>
                        {showWalletPicker && accounts.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden"
                          >
                            <div className="max-h-48 overflow-y-auto no-scrollbar py-1">
                              {accounts.map(acc => (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => { setSplitForm(f => ({ ...f, walletId: acc.id })); setShowWalletPicker(false); }}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${splitForm.walletId === acc.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${splitForm.walletId === acc.id ? 'bg-theme-brand/10 text-theme-brand' : 'bg-theme-surface text-theme-secondary'}`}>
                                    {renderAccountIcon(acc.icon, 13)}
                                  </span>
                                  <span className="flex-1 text-left truncate">{acc.name}</span>
                                  <span className="text-theme-secondary/40 font-normal text-[10px] flex-shrink-0">{acc.currency}</span>
                                  {splitForm.walletId === acc.id && <Check size={12} className="ml-1 flex-shrink-0 text-theme-brand" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {splitFormError && <p className="text-xs text-red-400 font-bold">{splitFormError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setEditingSplitId(null); setShowAddSplit(false); }} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={saveSplit} className="flex-1 py-3 rounded-2xl bg-theme-brand text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all">
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settlement Modal */}
      <AnimatePresence>
        {settlingSplit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full max-w-sm bg-theme-surface border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-black text-theme-primary">{t('markAsSettled')}</h3>
                <button onClick={() => setSettlingSplit(null)} className="w-8 h-8 rounded-full bg-theme-bg border border-white/5 flex items-center justify-center text-theme-secondary hover:text-theme-primary">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-theme-bg/50 rounded-2xl p-4 mb-4">
                <p className="text-sm font-black text-theme-primary">{settlingSplit.name}</p>
                <p className={`text-xl font-black mt-1 ${settlingSplit.direction === 'OWED_TO_YOU' ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${settlingSplit.remaining.toFixed(2)} {settlingSplit.currency || 'USD'}
                </p>
                <p className="text-[11px] text-theme-secondary mt-0.5">
                  {settlingSplit.direction === 'OWED_TO_YOU'
                    ? (t('settleOwedToYouDesc') || 'Receiving payment → adds to wallet')
                    : (t('settleYouOweDesc') || 'Paying debt → deducts from wallet')}
                </p>
              </div>

              <label className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-2 block">
                {settlingSplit.direction === 'OWED_TO_YOU' ? (t('receiveWallet') || 'Receive Wallet') : (t('sourceWallet') || 'Source Wallet')}
                {' '}<span className="opacity-50 normal-case font-normal">{t('optional')}</span>
              </label>

              <div className="flex flex-col gap-1.5 mb-5">
                <button
                  onClick={() => setSettleWalletId('')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm transition-all ${settleWalletId === '' ? 'bg-theme-surface border-white/20 text-theme-primary' : 'border-white/5 text-theme-secondary hover:border-white/10'}`}
                >
                  <X size={14} className="text-theme-secondary" />
                  <span className="font-bold text-xs">{t('noLinkedWallet') || 'Skip — just mark settled'}</span>
                </button>
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSettleWalletId(acc.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-black transition-all ${settleWalletId === acc.id ? 'bg-theme-brand/10 border-theme-brand/40 text-theme-brand' : 'border-white/5 text-theme-secondary hover:border-white/10 hover:bg-white/5'}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${settleWalletId === acc.id ? 'bg-theme-brand/20 text-theme-brand' : 'bg-theme-surface text-theme-secondary'}`}>
                      {renderAccountIcon(acc.icon, 14)}
                    </span>
                    <span className="flex-1 text-left truncate">{acc.name}</span>
                    <span className="text-[10px] font-normal opacity-60 flex-shrink-0">{acc.currency}</span>
                    {settleWalletId === acc.id && <Check size={12} className="flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSettlingSplit(null)} className="flex-1 py-3 rounded-2xl border border-white/10 text-sm font-black text-theme-secondary hover:bg-white/5 transition-colors">
                  {t('cancel')}
                </button>
                <button onClick={confirmSettle} className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <Check size={16} /> {t('markAsSettled')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
