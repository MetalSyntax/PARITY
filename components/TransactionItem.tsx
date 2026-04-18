import React from 'react';
import { Receipt, Settings, X, ArrowRightLeft, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Transaction, Currency, TransactionType, Account } from '../types';
import { CATEGORIES } from '../constants';
import { getTranslation } from '../i18n';
import { CurrencyAmount } from './CurrencyAmount';

interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
  lang: string;
  isBalanceVisible: boolean;
  displayCurrency: Currency;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  accounts,
  lang,
  isBalanceVisible,
  displayCurrency,
  onSelect,
  onEdit,
  onDelete,
  compact = false
}) => {
  const t = (key: any) => getTranslation(lang as any, key);
  const category = CATEGORIES.find(c => c.id === transaction.category) || CATEGORIES[0];
  const isExpense = transaction.type === TransactionType.EXPENSE;
  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;
  const isOriginalUSDType = transaction.originalCurrency === Currency.USD || transaction.originalCurrency === Currency.USDT;



  const fromAcc = accounts.find(a => a.id === transaction.accountId);
  const toAcc = accounts.find(a => a.id === transaction.toAccountId);
  const accName = fromAcc?.name || 'Unknown';

  const content = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(transaction);
      }}
      className={`flex items-center justify-between p-4 rounded-2xl hover:bg-theme-soft transition-colors group/tx relative bg-theme-surface border border-theme-soft mb-2 cursor-pointer`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-theme-soft ${isTransfer ? 'bg-indigo-500/10 text-indigo-400' : category.color
          } ${!isTransfer && !compact ? 'bg-opacity-20 shadow-inner' : ''}`}>
          {isTransfer ? <ArrowRightLeft size={22} /> : category.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-theme-primary line-clamp-1 flex items-center gap-1">
              {transaction.isAutoPosted && <RefreshCw size={12} className="text-theme-brand animate-spin-slow" />}
              {isTransfer ? `${fromAcc?.name} → ${toAcc?.name}` : transaction.note || t(category.name as any)}
            </p>
            {transaction.exchangeRate !== undefined && !isTransfer && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Custom Rate Used" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] font-bold text-theme-secondary opacity-50 uppercase tracking-tighter">
              {transaction.originalCurrency} • {accName}
            </p>
            {!compact && <span className="text-[10px] text-theme-secondary opacity-30">•</span>}
            {!compact && <p className="text-[10px] font-bold text-theme-secondary opacity-50">{new Date(transaction.date).toLocaleDateString()}</p>}
          </div>
          {!compact && transaction.fee !== undefined && transaction.fee > 0 && (
            <p className="text-[9px] text-red-400 font-bold uppercase mt-1">
              {t('commissions')}: {transaction.fee.toLocaleString()} {(transaction.originalCurrency === Currency.USD || transaction.originalCurrency === Currency.USDT) ? '$' : 'Bs'}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <CurrencyAmount
          amount={transaction.normalizedAmountUSD}
          exchangeRate={transaction.exchangeRate}
          euroRate={transaction.euroRate}
          displayCurrency={displayCurrency}
          isBalanceVisible={isBalanceVisible}
          showSecondary={true}
          type={transaction.type}
          showPlusMinus={!isTransfer}
          weight="black"
        />

        <div className="flex flex-col gap-1 opacity-0 group-hover/tx:opacity-100 transition-opacity ml-1">
          {transaction.receipt && (
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onSelect(transaction); }} 
              className="p-1.5 bg-theme-bg border border-white/5 rounded-lg text-theme-brand hover:bg-theme-brand hover:text-white transition-colors" 
              title={t('viewReceipt')}
            >
              <Receipt size={12} />
            </motion.button>
          )}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onEdit(transaction); }} 
            className="p-1.5 bg-theme-bg border border-white/5 rounded-lg text-theme-brand hover:bg-theme-brand hover:text-white transition-colors"
          >
            <Edit2 size={12} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }} 
            className="p-1.5 bg-theme-bg border border-white/5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 size={12} />
          </motion.button>
        </div>
      </div>
    </div>
  );

  if (compact) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {content}
    </motion.div>
  );
};
