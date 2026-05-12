import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search, TrendingUp, Coins, DollarSign, X, Receipt, Euro, Layers, Trash2, Calendar, RefreshCw, Plus, PieChart, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, Language, Currency, TransactionType, Account } from '../types';
import { getTranslation } from '../i18n';
import { formatMonth } from '../utils/formatUtils';
import { CATEGORIES } from '../constants';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { TransactionItem } from '../components/TransactionItem';
import { renderAccountIcon } from '../utils/iconUtils';

interface TransactionsListViewProps {
  onBack: () => void;
  transactions: Transaction[];
  accounts: Account[];
  lang: Language;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (t: Transaction) => void;
  isBalanceVisible: boolean;
  displayCurrency: Currency;
  onToggleDisplayCurrency: () => void;
  onUpdateTransaction: (t: Transaction) => void;
  initialViewMode?: 'LIST' | 'INVOICES';
  showConfirm: (config: { message: string, onConfirm: () => void }) => void;
}

export const TransactionsListView: React.FC<TransactionsListViewProps> = ({
  onBack,
  transactions,
  accounts,
  lang,
  onDeleteTransaction,
  onEditTransaction,
  isBalanceVisible,
  displayCurrency,
  onToggleDisplayCurrency,
  onUpdateTransaction,
  initialViewMode = 'LIST',
  showConfirm
}) => {
  const t = (key: any) => getTranslation(lang, key);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState<'month' | 'wallet' | 'type' | 'category' | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'INVOICES'>(initialViewMode);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState(new Date().toISOString().slice(0, 7));
  const [addedMonths, setAddedMonths] = useState<string[]>(() => {
    const saved = localStorage.getItem('parity_custom_months');
    return saved ? JSON.parse(saved) : [];
  });
  const [monthFormat, setMonthFormat] = useState(() => localStorage.getItem('parity_month_format') || 'YYYY-MM');

  const popupRef = useRef<HTMLDivElement>(null);
  const monthHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('parity_custom_months');
      if (saved) setAddedMonths(JSON.parse(saved));
      const fmt = localStorage.getItem('parity_month_format');
      if (fmt) setMonthFormat(fmt);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('parity-format-changed', handleSync);
    window.addEventListener('parity-months-changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('parity-format-changed', handleSync);
      window.removeEventListener('parity-months-changed', handleSync);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const inPopup = popupRef.current?.contains(e.target as Node);
      const inMonth = monthHeaderRef.current?.contains(e.target as Node);
      if (!inPopup && !inMonth) setOpenPopup(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDeleteMonth = (m: string) => {
    showConfirm({
      message: `${t('delete')}: ${m}`,
      onConfirm: () => {
        const next = addedMonths.filter(x => x !== m);
        setAddedMonths(next);
        localStorage.setItem('parity_custom_months', JSON.stringify(next));
        if (selectedMonth === m) setSelectedMonth('ALL');
      }
    });
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const current = new Date().toISOString().slice(0, 7);
    months.add(current);
    transactions.forEach(tx => months.add(tx.date.slice(0, 7)));
    addedMonths.forEach(m => months.add(m));
    return Array.from(months).sort().reverse();
  }, [transactions, addedMonths]);

  const activeFilterCount = [searchQuery, filterType !== 'ALL', selectedWalletId, selectedMonth !== 'ALL', selectedCategory !== 'ALL'].filter(Boolean).length;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const category = CATEGORIES.find((c) => c.id === tx.category);
      const categoryName = category ? t(category.name.toLowerCase()) : '';
      const matchesSearch =
        (tx.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || tx.type === filterType;
      const matchesCategory = selectedCategory === 'ALL' || tx.category === selectedCategory;
      const matchesMonth = selectedMonth === 'ALL' || tx.date.startsWith(selectedMonth);
      const matchesWallet = !selectedWalletId || tx.accountId === selectedWalletId || tx.toAccountId === selectedWalletId;
      return matchesSearch && matchesType && matchesCategory && matchesMonth && matchesWallet;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, filterType, selectedCategory, lang, selectedMonth, selectedWalletId]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const date = tx.date.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedTransactions]);

  const togglePopup = (name: typeof openPopup) => setOpenPopup(prev => prev === name ? null : name);

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setSelectedWalletId(null);
    setSelectedMonth('ALL');
    setSelectedCategory('ALL');
    setOpenPopup(null);
  };

  const selectedWallet = accounts.find(a => a.id === selectedWalletId);
  const selectedCat = CATEGORIES.find(c => c.id === selectedCategory);

  const filterBtnActive = (active: boolean) =>
    `w-full flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all border shadow-sm ${
      active
        ? 'bg-theme-brand text-white border-theme-brand shadow-lg'
        : 'bg-theme-surface border-white/5 text-theme-secondary hover:text-theme-primary hover:border-white/10'
    }`;

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">

      {/* Top utility bar */}
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          onClick={onToggleDisplayCurrency}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/5 transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {displayCurrency === Currency.VES ? (
              <span className="text-[9px] font-black leading-none">Bs</span>
            ) : displayCurrency === Currency.EUR ? (
              <Euro size={14} />
            ) : (
              <DollarSign size={14} />
            )}
          </div>
          <span className="hidden sm:inline">{displayCurrency}</span>
        </button>
      </div>

      {/* Main Header */}
      <div className="flex items-center gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-theme-primary">{t('transactions')}</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-theme-secondary font-medium">{t('fullHistory')}</p>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <span className="text-[10px] font-black text-theme-brand uppercase tracking-tighter">
              {filteredTransactions.length}
            </span>
            {activeFilterCount > 0 && (
              <>
                <div className="w-1 h-1 bg-white/10 rounded-full" />
                <button onClick={clearAllFilters} className="flex items-center gap-1 text-[10px] font-black text-red-400 hover:text-red-300 transition-colors">
                  <X size={10} /> {t('clearFilters')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Month picker in header */}
        <div className="relative flex-shrink-0" ref={monthHeaderRef}>
          <button
            onClick={() => togglePopup('month')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-[11px] font-black transition-all ${selectedMonth !== 'ALL' ? 'bg-theme-brand text-white border-theme-brand shadow-lg' : 'bg-theme-surface border-white/5 text-theme-secondary hover:text-theme-primary hover:border-white/10'}`}
          >
            <Calendar size={14} />
            <span>{selectedMonth !== 'ALL' ? formatMonth(selectedMonth, 'MMM YY', lang) : t('month')}</span>
          </button>
          <AnimatePresence>
            {openPopup === 'month' && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-52 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto no-scrollbar py-1">
                  <button
                    onClick={() => { setSelectedMonth('ALL'); setOpenPopup(null); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${selectedMonth === 'ALL' ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                  >
                    {t('allPeriods')}
                  </button>
                  <div className="h-px bg-white/5 mx-3" />
                  {availableMonths.map(m => (
                    <div key={m} className={`group flex items-center justify-between px-4 py-2 transition-colors hover:bg-white/5 ${selectedMonth === m ? 'bg-white/5' : ''}`}>
                      <button
                        onClick={() => { setSelectedMonth(m); setOpenPopup(null); }}
                        className={`flex-1 text-left text-xs font-black ${selectedMonth === m ? 'text-theme-brand' : 'text-theme-secondary'}`}
                      >
                        {formatMonth(m, monthFormat, lang)}
                      </button>
                      {addedMonths.includes(m) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMonth(m); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-theme-secondary transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="border-t border-white/5 mt-1 p-2 flex items-center gap-1">
                    <button
                      onClick={() => { setOpenPopup(null); setShowAddMonthModal(true); }}
                      className="flex-1 flex items-center gap-1.5 px-2 py-2 text-[10px] font-black text-theme-brand hover:bg-theme-brand/10 rounded-lg transition-colors border border-theme-brand/20"
                    >
                      <Plus size={12} /> {t('addMonth')}
                    </button>
                    <button
                      onClick={() => {
                        const formats = ['YYYY-MM', 'MM/YYYY', 'MMM YYYY', 'MMMM YYYY'];
                        const next = formats[(formats.indexOf(monthFormat) + 1) % formats.length];
                        setMonthFormat(next);
                        localStorage.setItem('parity_month_format', next);
                        window.dispatchEvent(new Event('parity-format-changed'));
                      }}
                      className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-white/5 rounded-lg transition-colors"
                      title={t('dateFormat')}
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex p-1 bg-theme-surface rounded-2xl mb-6 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setViewMode('LIST')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-theme-bg text-theme-primary shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
        >
          <Layers size={16} className={viewMode === 'LIST' ? 'text-theme-brand' : ''} />
          {t('transactions')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setViewMode('INVOICES')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${viewMode === 'INVOICES' ? 'bg-theme-bg text-theme-primary shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
        >
          <Receipt size={16} className={viewMode === 'INVOICES' ? 'text-theme-brand' : ''} />
          {t('invoices')}
        </motion.button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 mb-6">

        {/* Row 1: Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none" size={16} />
          <input
            type="text"
            placeholder={t('searchTransactions')}
            className="w-full bg-theme-surface border border-white/5 rounded-2xl py-3 pl-11 pr-10 text-sm text-theme-primary placeholder:text-theme-secondary outline-none focus:border-theme-brand/40 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-secondary hover:text-theme-primary transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Row 2: 3 filter buttons — wallet | type | category */}
        <div ref={popupRef} className="grid grid-cols-3 gap-2">

          {/* Wallet */}
          <div className="relative">
            <button onClick={() => togglePopup('wallet')} className={filterBtnActive(!!selectedWalletId)}>
              {selectedWallet ? renderAccountIcon(selectedWallet.icon, 17) : <Receipt size={17} />}
              <span className="text-[8px] font-black uppercase tracking-tight leading-none truncate w-full text-center px-1">
                {selectedWallet ? selectedWallet.name : t('wallet')}
              </span>
            </button>
            <AnimatePresence>
              {openPopup === 'wallet' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 w-48 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="max-h-56 overflow-y-auto no-scrollbar py-1">
                    <button
                      onClick={() => { setSelectedWalletId(null); setOpenPopup(null); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${!selectedWalletId ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                    >
                      {t('all')}
                    </button>
                    <div className="h-px bg-white/5 mx-3" />
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => { setSelectedWalletId(acc.id); setOpenPopup(null); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${selectedWalletId === acc.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                      >
                        <span className="flex-shrink-0">{renderAccountIcon(acc.icon, 14)}</span>
                        <span>{acc.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Type */}
          <div className="relative">
            <button onClick={() => togglePopup('type')} className={filterBtnActive(filterType !== 'ALL')}>
              <ArrowRightLeft size={17} />
              <span className="text-[8px] font-black uppercase tracking-tight leading-none truncate w-full text-center px-1">
                {filterType === 'ALL' ? t('type') : t(filterType.toLowerCase())}
              </span>
            </button>
            <AnimatePresence>
              {openPopup === 'type' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 w-40 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="py-1">
                    {(['ALL', TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => { setFilterType(type); setOpenPopup(null); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${filterType === type ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                      >
                        {type === 'ALL' ? t('all') : t(type.toLowerCase())}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category */}
          <div className="relative">
            <button onClick={() => togglePopup('category')} className={filterBtnActive(selectedCategory !== 'ALL')}>
              {selectedCat
                ? <span className="flex items-center justify-center w-[17px] h-[17px] text-[15px] leading-none">{selectedCat.icon}</span>
                : <PieChart size={17} />
              }
              <span className="text-[8px] font-black uppercase tracking-tight leading-none truncate w-full text-center px-1">
                {selectedCat ? t(selectedCat.name.toLowerCase()) : t('category')}
              </span>
            </button>
            <AnimatePresence>
              {openPopup === 'category' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-52 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="max-h-72 overflow-y-auto no-scrollbar py-1">
                    <button
                      onClick={() => { setSelectedCategory('ALL'); setOpenPopup(null); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${selectedCategory === 'ALL' ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                    >
                      {t('all')}
                    </button>
                    <div className="h-px bg-white/5 mx-3" />
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setOpenPopup(null); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-black transition-colors hover:bg-white/5 ${selectedCategory === cat.id ? 'text-theme-brand bg-white/5' : 'text-theme-secondary'}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] flex-shrink-0 ${cat.color}`}>{cat.icon}</span>
                        <span className="truncate">{t(cat.name.toLowerCase())}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Transactions List */}
      <div>
        {viewMode === 'INVOICES' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {filteredTransactions.filter(tx => tx.receipt).length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-theme-secondary">
                <div className="w-16 h-16 rounded-full bg-theme-surface flex items-center justify-center mb-4">
                  <Receipt size={24} />
                </div>
                <p className="text-sm">{t('noInvoicesFound')}</p>
              </div>
            ) : (
              filteredTransactions.filter(tx => tx.receipt).map(tx => (
                <motion.div
                  key={tx.id}
                  layoutId={`tx-invoice-${tx.id}`}
                  onClick={() => setSelectedTx(tx)}
                  className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square cursor-pointer hover:border-theme-brand transition-colors"
                >
                  <img src={tx.receipt} alt="Receipt" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-[10px] font-bold truncate">
                      {tx.note || (t(CATEGORIES.find(c => c.id === tx.category)?.name.toLowerCase() || ''))}
                    </p>
                    <p className="text-white/70 text-[9px]">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-theme-secondary">
            <div className="w-16 h-16 rounded-full bg-theme-surface flex items-center justify-center mb-4">
              <Search size={24} />
            </div>
            <p className="text-sm">{t('noTransactionsFound')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 mt-4">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-xs font-bold text-theme-secondary uppercase tracking-widest mb-4 sticky top-0 bg-theme-bg/95 backdrop-blur-sm py-2 z-10">
                  {(() => {
                    const dateObj = new Date(`${date}T12:00:00`);
                    const todayStr = new Date().toISOString().split('T')[0];
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    if (date === todayStr) return t('today');
                    if (date === yesterdayStr) return t('yesterday');
                    return dateObj?.toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    });
                  })()}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-1">
                  {groupedTransactions[date].map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      accounts={accounts}
                      lang={lang}
                      isBalanceVisible={isBalanceVisible}
                      displayCurrency={displayCurrency}
                      onSelect={setSelectedTx}
                      onEdit={onEditTransaction}
                      onDelete={onDeleteTransaction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionDetailModal
        transaction={selectedTx!}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={onEditTransaction}
        onUpdateTransaction={onUpdateTransaction}
        language={lang}
        displayCurrency={displayCurrency}
      />

      {/* Add Month Modal */}
      <AnimatePresence>
        {showAddMonthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-theme-surface w-full max-w-sm rounded-[32px] border border-white/10 p-8 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-theme-primary">{t('addMonth')}</h3>
                <button onClick={() => setShowAddMonthModal(false)} className="text-theme-secondary hover:text-theme-primary">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-theme-secondary uppercase tracking-widest block mb-2">{t('selectDate')}</label>
                  <input
                    type="month"
                    value={newMonthInput}
                    onChange={(e) => setNewMonthInput(e.target.value)}
                    className="w-full bg-theme-bg border border-white/5 rounded-2xl px-4 py-4 text-theme-primary font-bold focus:border-theme-brand outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    const next = Array.from(new Set([...addedMonths, newMonthInput]));
                    setAddedMonths(next);
                    localStorage.setItem('parity_custom_months', JSON.stringify(next));
                    window.dispatchEvent(new Event('parity-months-changed'));
                    setSelectedMonth(newMonthInput);
                    setShowAddMonthModal(false);
                  }}
                  className="w-full py-4 bg-theme-brand text-white rounded-2xl font-black shadow-lg shadow-brand/20 active:scale-95 transition-all"
                >
                  {t('addMonth')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
