import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, Plus, TrendingUp, ChevronDown, Coins, DollarSign, X, Receipt, Euro, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, Language, Currency, TransactionType, Account } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { TransactionItem } from '../components/TransactionItem';

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
  initialViewMode = 'LIST'
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string | 'ALL'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string | 'ALL'>('ALL'); // YYYY-MM
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'INVOICES'>(initialViewMode);

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
      
      return matchesSearch && matchesType && matchesCategory && matchesMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, filterType, selectedCategory, lang, selectedMonth]);

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
    return Object.keys(groupedTransactions).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedTransactions]);

  return (
    <div className="h-full flex flex-col bg-theme-bg overflow-y-auto no-scrollbar px-6 py-6 pb-24 animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">
      {/* Header */}
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
            <div className="relative">
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="bg-theme-surface border border-white/5 text-xs font-bold text-theme-secondary rounded-2xl px-4 py-2 outline-none focus:border-theme-soft/50 transition-all cursor-pointer hover:text-theme-primary flex items-center gap-2 min-w-[100px] justify-between relative"
              >
                <span>{selectedMonth === 'ALL' ? (t('allPeriods') || 'All Time') : selectedMonth}</span>
                <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showMonthPicker && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowMonthPicker(false)} />
                    <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 w-48 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                    >
                      <div className="max-h-[320px] overflow-y-auto no-scrollbar py-2">
                        <button 
                           onClick={() => {
                             setSelectedMonth('ALL');
                             setShowMonthPicker(false);
                           }}
                           className={`w-full text-left px-4 py-3 text-xs font-black transition-colors hover:bg-white/5 ${selectedMonth === 'ALL' ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                        >
                           📅 {t('allPeriods') || 'All Time'}
                        </button>
                        <div className="h-[1px] bg-white/5 my-1" />
                        {(() => {
                            const months = new Set<string>();
                            const current = new Date().toISOString().slice(0, 7);
                            months.add(current);
                            transactions.forEach(t => months.add(t.date.slice(0, 7)));
                            return Array.from(months).sort().reverse().map(m => (
                                <button
                                  key={m}
                                  onClick={() => {
                                    setSelectedMonth(m);
                                    setShowMonthPicker(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-white/5 ${selectedMonth === m ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}
                                >
                                  {m}
                                </button>
                            ));
                        })()}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
           <div>
               <h1 className="text-xl font-bold text-theme-primary">{t('transactions')}</h1>
               <div className="flex items-center gap-2">
                  <p className="text-xs text-theme-secondary font-medium">{t('fullHistory') || 'Historial completo'}</p>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <span className="text-[10px] font-black text-theme-brand uppercase tracking-tighter">
                    {filteredTransactions.length}
                  </span>
               </div>
           </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex p-1 bg-theme-surface rounded-2xl mb-8 flex-shrink-0">
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
          {t('invoices') || 'Facturas'}
        </motion.button>
      </div>

      <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
              <input
                type="text"
                placeholder={t('searchTransactions')}
                className="w-full bg-theme-surface border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-theme-primary placeholder:text-theme-secondary outline-none focus:border-theme-soft/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center relative ${
                selectedCategory !== 'ALL' 
                  ? 'bg-theme-brand border-theme-soft text-white shadow-lg shadow-brand/20' 
                  : 'bg-theme-surface border-white/5 text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <Filter size={20} />
              {selectedCategory !== 'ALL' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-theme-brand" />
              )}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {(['ALL', TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                    filterType === type
                      ? 'bg-theme-brand border-theme-soft text-white shadow-lg shadow-brand/20'
                      : 'bg-theme-surface border-white/5 text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {type === 'ALL' ? t('allTypes') || t('all') : t(type.toLowerCase())}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="mt-4">
        {viewMode === 'INVOICES' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {filteredTransactions.filter(tx => tx.receipt).length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center py-20 text-theme-secondary">
                 <div className="w-16 h-16 rounded-full bg-theme-surface flex items-center justify-center mb-4">
                   <Receipt size={24} />
                 </div>
                 <p className="text-sm">{t('noInvoicesFound') || 'No se encontraron facturas'}</p>
               </div>
            ) : (
                filteredTransactions.filter(tx => tx.receipt).map(tx => (
                  <motion.div 
                    key={tx.id}
                    layoutId={`tx-invoice-${tx.id}`}
                    onClick={() => setSelectedTx(tx)}
                    className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square cursor-pointer hover:border-theme-brand transition-colors"
                  >
                    <img 
                      src={tx.receipt} 
                      alt="Receipt" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-white text-[10px] font-bold truncate">
                        {tx.note || (CATEGORIES.find(c => c.id === tx.category)?.name) || ''}
                      </p>
                      <p className="text-white/70 text-[9px]">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        ) : (
          sortedDates.length === 0 ? (
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
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
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
        )
        )}
      </div>

      {/* Category Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-theme-surface w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <Filter size={18} className="text-theme-brand" />
                  <h3 className="font-bold text-theme-primary">{t('filterByCategory')}</h3>
                </div>
                <button 
                  onClick={() => setShowFilterModal(false)} 
                  className="p-2 hover:bg-white/10 rounded-full text-theme-secondary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar">
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => { setSelectedCategory('ALL'); setShowFilterModal(false); }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                      selectedCategory === 'ALL'
                        ? 'bg-theme-brand border-theme-soft text-white shadow-lg'
                        : 'bg-white/5 border-white/5 text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Filter size={18} />
                    </div>
                    <span className="font-bold text-sm tracking-wide uppercase">{t('allCategories') || t('all')}</span>
                  </motion.button>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {CATEGORIES.map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedCategory(cat.id); setShowFilterModal(false); }}
                        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all text-center ${
                          selectedCategory === cat.id
                            ? 'bg-theme-brand border-theme-soft text-white shadow-lg'
                            : 'bg-white/5 border-white/5 text-theme-secondary hover:text-theme-primary'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.color} bg-opacity-20 shadow-inner text-xl`}>
                          {cat.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider">{t(cat.name.toLowerCase()) || cat.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="w-full py-4 bg-theme-surface border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs text-theme-primary hover:bg-white/10 transition-all"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <TransactionDetailModal
        transaction={selectedTx!}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={onEditTransaction}
        onUpdateTransaction={onUpdateTransaction}
        language={lang}
        displayCurrency={displayCurrency}
      />
    </div>
  );
};
