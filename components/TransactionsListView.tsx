import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, Plus, TrendingUp } from 'lucide-react';
import { Transaction, Language, Currency, TransactionType } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';

interface TransactionsListViewProps {
  onBack: () => void;
  transactions: Transaction[];
  lang: Language;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (t: Transaction) => void;
  isBalanceVisible: boolean;
}

export const TransactionsListView: React.FC<TransactionsListViewProps> = ({
  onBack,
  transactions,
  lang,
  onDeleteTransaction,
  onEditTransaction,
  isBalanceVisible,
}) => {
  const t = (key: any) => getTranslation(lang, key);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const category = CATEGORIES.find((c) => c.id === tx.category);
      const categoryName = category ? t(category.name.toLowerCase()) : '';
      const matchesSearch = 
        (tx.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'ALL' || tx.type === filterType;
      
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, filterType, lang]);

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
    <div className="h-full flex flex-col bg-theme-bg overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 bg-theme-surface rounded-full text-theme-secondary hover:text-theme-primary transition-colors border border-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-theme-primary">{t('transactions')}</h1>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
            <input
              type="text"
              placeholder={t('searchTransactions')}
              className="w-full bg-theme-surface border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-theme-primary placeholder:text-theme-secondary outline-none focus:border-theme-brand/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {(['ALL', TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  filterType === type
                    ? 'bg-theme-brand border-theme-brand text-white shadow-lg shadow-brand/20'
                    : 'bg-theme-surface border-white/5 text-theme-secondary hover:text-theme-primary'
                }`}
              >
                {type === 'ALL' ? t('all') : t(type.toLowerCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">
        {sortedDates.length === 0 ? (
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
                    
                    return dateObj.toLocaleDateString(undefined, { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    });
                  })()}
                </h3>
                <div className="flex flex-col gap-2">
                  {groupedTransactions[date].map((transaction) => {
                    const category = CATEGORIES.find((c) => c.id === transaction.category) || CATEGORIES[0];
                    const isExpense = transaction.type === TransactionType.EXPENSE;
                    const isIncome = transaction.type === TransactionType.INCOME;
                    const isOriginalUSD = transaction.originalCurrency === Currency.USD;
                    const mainAmount = transaction.amount;
                    const mainSymbol = isOriginalUSD ? "$" : "Bs.";
                    const secondaryAmount = isOriginalUSD 
                      ? transaction.amount * transaction.exchangeRate 
                      : transaction.amount / transaction.exchangeRate;
                    const secondarySymbol = isOriginalUSD ? "Bs." : "$";

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-theme-surface border border-white/5 hover:border-white/10 transition-all group relative pr-16"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${category.color} bg-opacity-20 shadow-inner`}
                          >
                            {category.icon}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-theme-primary">
                              {transaction.note || t(category.name)}
                            </p>
                            <p className="text-xs text-theme-secondary capitalize">
                              {t(category.name.toLowerCase()) || category.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-black text-sm ${
                              isIncome ? "text-emerald-400" : "text-theme-primary"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {mainSymbol}
                            {isBalanceVisible
                              ? mainAmount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "***"}
                          </p>
                          <p className="text-[10px] text-theme-secondary font-mono">
                            ~{secondarySymbol}{" "}
                            {isBalanceVisible
                              ? secondaryAmount.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "***"}
                          </p>
                        </div>
                        
                        {/* Actions Overlay */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTransaction(transaction);
                            }}
                            className="p-2 bg-theme-bg/80 backdrop-blur-sm hover:bg-theme-brand rounded-xl text-theme-brand hover:text-white transition-colors border border-white/5"
                          >
                            <TrendingUp size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTransaction(transaction.id);
                            }}
                            className="p-2 bg-theme-bg/80 backdrop-blur-sm hover:bg-red-500 rounded-xl text-red-400 hover:text-white transition-colors border border-white/5"
                          >
                            <Plus size={14} className="rotate-45" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
