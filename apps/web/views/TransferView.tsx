import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowDown, ArrowRight, DollarSign, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Account, TransactionType, Language, Currency, Transaction, convertCurrency } from '@parity/core';
import { getTranslation } from '@parity/i18n';
import { CATEGORIES } from '../constants';

interface TransferViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onBack: () => void;
  onTransfer: (data: any) => void;
  lang: Language;
  exchangeRate: number;
  euroRate?: number;
  displayCurrency: Currency;
  onToggleDisplayCurrency: () => void;
  usdtSpread?: number;
}

export const TransferSchema = z.object({
  fromId: z.string().min(1),
  toId: z.string().min(1),
  amount: z
    .string()
    .min(1, 'Required')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: 'Must be > 0' }),
  fee: z.string().optional().default(''),
  category: z.string().default('transfer'),
}).refine(d => d.fromId !== d.toId, {
  message: 'Cannot transfer to the same account',
  path: ['toId'],
});

type TransferFormValues = z.infer<typeof TransferSchema>;

function calcConverted(
  amount: string,
  fee: string,
  fromCurrency: Currency | undefined,
  toCurrency: Currency | undefined,
  exchangeRate: number,
  euroRate?: number,
  usdtSpread: number = 0,
): number | null {
  if (!amount || !fromCurrency || !toCurrency) return null;
  const val = parseFloat(amount);
  if (isNaN(val) || val <= 0) return null;
  const f = parseFloat(fee || '0') || 0;
  const net = val - f;
  
  return convertCurrency(
    net,
    fromCurrency,
    toCurrency,
    { usdToVes: exchangeRate, eurToVes: euroRate || exchangeRate },
    usdtSpread / 100 // Convert percentage to decimal
  );
}

export const TransferView: React.FC<TransferViewProps> = ({
  accounts,
  transactions,
  onBack,
  onTransfer,
  lang,
  exchangeRate,
  euroRate,
  displayCurrency,
  onToggleDisplayCurrency,
  usdtSpread = 0,
}) => {
  const t = (key: any) => getTranslation(lang, key);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(TransferSchema),
    defaultValues: {
      fromId: accounts[0]?.id || '',
      toId: accounts.length > 1 ? accounts[1].id : accounts[0]?.id || '',
      amount: '',
      fee: '',
      category: 'transfer',
    },
  });

  const [fromId, toId, amount, fee, category] = watch(['fromId', 'toId', 'amount', 'fee', 'category']);

  const fromAccount = accounts.find(a => a.id === fromId);
  const toAccount = accounts.find(a => a.id === toId);
  const convertedAmount = calcConverted(amount, fee, fromAccount?.currency, toAccount?.currency, exchangeRate, euroRate, usdtSpread);

  const onSubmit = (data: TransferFormValues) => {
    const val = parseFloat(data.amount);
    onTransfer({
      amount: val,
      originalCurrency: fromAccount?.currency,
      exchangeRate,
      type: TransactionType.TRANSFER,
      accountId: data.fromId,
      toAccountId: data.toId,
      category: data.category,
      note: `Transfer to ${toAccount?.name}`,
      fee: parseFloat(data.fee || '0') || 0,
      euroRate,
      date: new Date().toISOString(),
    });
    onBack();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-theme-primary">{t('transfer')}</h1>
            <p className="text-xs text-theme-secondary font-medium">{t('transferSubtitle')}</p>
          </div>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
        </motion.button>
      </div>

      <div className="flex flex-col gap-4 relative">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-colors">
          <label className="text-xs text-zinc-500 mb-2 block">{t('from')}</label>
          <select
            {...register('fromId')}
            className="w-full bg-transparent text-white outline-none font-bold text-lg"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-zinc-900">
                {acc.icon} {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-zinc-500">
            {t('available')}: {fromAccount?.balance.toLocaleString()} {fromAccount?.currency}
          </div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center border-4 border-background z-10 shadow-lg shadow-indigo-500/20"
        >
          <ArrowDown size={16} className="text-white" />
        </motion.div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-colors">
          <label className="text-xs text-zinc-500 mb-2 block">{t('to')}</label>
          <select
            {...register('toId')}
            className="w-full bg-transparent text-white outline-none font-bold text-lg"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-zinc-900">
                {acc.icon} {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
          {errors.toId && (
            <p className="mt-1 text-[10px] text-red-400 font-bold">{errors.toId.message}</p>
          )}
        </div>
      </div>

      <motion.div layout className="mt-8 bg-[#121212] p-6 rounded-2xl border border-white/5">
        <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider">{t('amount')}</label>
        <div className="flex items-baseline gap-2">
          <input
            {...register('amount')}
            type="number"
            placeholder="0.00"
            className="w-full bg-transparent text-5xl font-bold text-white outline-none placeholder:text-zinc-700"
          />
          <span className="text-xl font-bold text-zinc-500">{fromAccount?.currency}</span>
        </div>
        {errors.amount && (
          <p className="mt-1 text-[10px] text-red-400 font-bold">{errors.amount.message}</p>
        )}

        <AnimatePresence>
          {convertedAmount !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{t('commissions')}</label>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                  <input
                    {...register('fee')}
                    type="number"
                    placeholder="0.00"
                    className="bg-transparent text-sm font-bold text-red-400 outline-none w-16 text-right"
                  />
                  <span className="text-[10px] text-zinc-500 font-bold">{fromAccount?.currency}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-indigo-400">
                <ArrowRight size={16} />
                <span className="font-mono text-lg font-bold">
                  {t('totalTarget')}: {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toAccount?.currency}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-6">
        <label className="text-xs text-zinc-500 mb-3 block uppercase tracking-wider px-1">{t('category')}</label>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.slice(0, 10).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setValue('category', cat.id)}
              className={`flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-2xl border transition-all ${category === cat.id ? 'bg-theme-bg border-theme-soft scale-105 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
            >
              <div className={`w-10 h-10 rounded-2xl ${cat.color} flex items-center justify-center`}>
                {cat.icon}
              </div>
              <span className="text-[10px] font-bold text-center truncate w-full uppercase">{t(cat.name)}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/40 transition-all"
      >
        {t('transferNow')}
      </motion.button>

      {/* Recent Transfers */}
      <div className="mt-12 mb-20">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">{t('recentTransactions')}</h3>
        <div className="flex flex-col gap-3">
          {(() => {
            const transfers = transactions
              ?.filter(tx => tx.type === TransactionType.TRANSFER)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5) || [];

            if (transfers.length === 0) {
              return (
                <div className="p-8 text-center text-zinc-600 text-sm border-2 border-dashed border-white/5 rounded-2xl">
                  {t('noTransactions')}
                </div>
              );
            }

            return transfers.map(tx => {
              const fAcc = accounts.find(a => a.id === tx.accountId);
              const tAcc = accounts.find(a => a.id === (tx as any).toAccountId);
              return (
                <div key={tx.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <ArrowRight size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{fAcc?.name} → {tAcc?.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-400">
                      {(tx as any).originalCurrency === Currency.EUR ? '€' : ((tx as any).originalCurrency === Currency.USD || (tx as any).originalCurrency === Currency.USDT) ? '$' : 'Bs'}{' '}
                      {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-mono">
                      {(() => {
                        const rate = (tx as any).exchangeRate || exchangeRate;
                        const eRate = (tx as any).euroRate || euroRate || 1;
                        if (displayCurrency === Currency.VES) return `Bs ${(tx.normalizedAmountUSD * rate).toLocaleString()}`;
                        if (displayCurrency === Currency.EUR) return `€ ${((tx.normalizedAmountUSD * rate) / eRate).toLocaleString()}`;
                        return `$ ${tx.normalizedAmountUSD.toLocaleString()}`;
                      })()}
                    </p>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </form>
  );
};
