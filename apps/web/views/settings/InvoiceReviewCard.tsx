import React, { useState } from 'react';
import { Check, X as XIcon, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Transaction, InvoiceData, InvoiceLineItem, Language } from '@parity/core';
import { getTranslation } from '@parity/i18n';

interface InvoiceReviewCardProps {
  transaction: Transaction;
  invoiceData: InvoiceData;
  lang: Language;
  status: 'pending' | 'saved' | 'skipped';
  onConfirm: (data: InvoiceData) => void;
  onSkip: () => void;
}

/**
 * Two-column review card — receipt image on one side, extracted invoice fields
 * (header, line-item table, totals block) on the other, editable before commit.
 * Shared by the batch migration tool (InvoiceDigitizeView) and the single-receipt
 * quick-digitize flow (InvoiceQuickDigitizeModal) so both stay visually identical.
 */
export const InvoiceReviewCard: React.FC<InvoiceReviewCardProps> = ({ transaction, invoiceData, lang, status, onConfirm, onSkip }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [draft, setDraft] = useState<InvoiceData>(invoiceData);
  const isPending = status === 'pending';
  const disabledCls = isPending ? '' : 'opacity-60 pointer-events-none';

  const update = (field: keyof InvoiceData, value: any) => setDraft(prev => ({ ...prev, [field]: value }));

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const items = [...draft.lineItems];
    items[index] = { ...items[index], [field]: value };
    update('lineItems', items);
  };

  const addLineItem = () => update('lineItems', [...draft.lineItems, { description: '', total: 0 }]);
  const removeLineItem = (index: number) => update('lineItems', draft.lineItems.filter((_, i) => i !== index));

  return (
    <div className={`bg-theme-surface border rounded-2xl overflow-hidden ${status === 'saved' ? 'border-emerald-500/40' : status === 'skipped' ? 'border-theme-soft opacity-50' : 'border-theme-soft'}`}>
      {/* Two-column layout — receipt image on the left, extracted invoice fields on the right, like the source document next to its digitized read */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-theme-bg p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-theme-soft">
          {transaction.receipt ? (
            <img src={transaction.receipt} alt="receipt" className="max-h-80 w-full object-contain rounded-xl" />
          ) : (
            <div className="h-40 w-full rounded-xl bg-theme-surface flex items-center justify-center">
              <ImageIcon size={28} className="text-theme-secondary opacity-40" />
            </div>
          )}
        </div>

        <div className={`p-4 space-y-4 ${disabledCls}`}>
          {/* Header — merchant left, date right, like an invoice letterhead */}
          <div className="flex items-start justify-between gap-2">
            <input
              placeholder={t('digitizeMerchant')}
              value={draft.merchant || ''}
              onChange={e => update('merchant', e.target.value)}
              disabled={!isPending}
              className="flex-1 bg-transparent text-sm font-black text-theme-primary outline-none border-b border-theme-soft pb-1"
            />
            <input
              type="date"
              value={draft.invoiceDate ? draft.invoiceDate.slice(0, 10) : ''}
              onChange={e => update('invoiceDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              disabled={!isPending}
              className="bg-transparent text-[11px] font-bold text-theme-secondary outline-none border-b border-theme-soft pb-1 w-32"
            />
          </div>

          {/* Line-item table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-theme-secondary uppercase tracking-widest opacity-60">{t('digitizeItems')}</p>
              {isPending && (
                <button onClick={addLineItem} className="text-theme-brand flex items-center gap-1 text-[10px] font-bold">
                  <Plus size={12} /> {t('digitizeAddItem')}
                </button>
              )}
            </div>
            {draft.lineItems.length === 0 ? (
              <p className="text-[11px] text-theme-secondary opacity-40 italic">{t('digitizeNoItemsFound')}</p>
            ) : (
              <div className="space-y-1">
                {draft.lineItems.map((li, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      placeholder={t('digitizeItemDescription')}
                      value={li.description}
                      onChange={e => updateLineItem(idx, 'description', e.target.value)}
                      disabled={!isPending}
                      className="flex-1 bg-theme-bg border border-theme-soft rounded-lg px-2 py-1.5 text-[11px] font-bold text-theme-primary outline-none min-w-0"
                    />
                    <input
                      type="number"
                      placeholder={t('digitizeItemAmount')}
                      value={li.total ?? ''}
                      onChange={e => updateLineItem(idx, 'total', parseFloat(e.target.value) || 0)}
                      disabled={!isPending}
                      className="w-20 bg-theme-bg border border-theme-soft rounded-lg px-2 py-1.5 text-[11px] font-bold text-theme-primary outline-none text-right flex-shrink-0"
                    />
                    {isPending && (
                      <button onClick={() => removeLineItem(idx)} className="text-theme-secondary opacity-50 hover:opacity-100 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals block — bottom-right, like a real invoice footer */}
          <div className="pt-3 border-t border-theme-soft space-y-1.5 ml-auto max-w-[70%]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-theme-secondary">{t('digitizeSubtotal')}</span>
              <input
                type="number"
                value={draft.subtotal ?? ''}
                onChange={e => update('subtotal', parseFloat(e.target.value) || undefined)}
                disabled={!isPending}
                className="w-24 bg-theme-bg border border-theme-soft rounded-lg px-2 py-1 text-[11px] font-bold text-theme-primary outline-none text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-theme-secondary">{t('digitizeTax')}</span>
              <input
                type="number"
                value={draft.tax ?? ''}
                onChange={e => update('tax', parseFloat(e.target.value) || undefined)}
                disabled={!isPending}
                className="w-24 bg-theme-bg border border-theme-soft rounded-lg px-2 py-1 text-[11px] font-bold text-theme-primary outline-none text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-theme-primary">{t('digitizeTotal')}</span>
              <input
                type="number"
                value={draft.total ?? ''}
                onChange={e => update('total', parseFloat(e.target.value) || undefined)}
                disabled={!isPending}
                className="w-24 bg-theme-bg border border-theme-brand/40 rounded-lg px-2 py-1 text-xs font-black text-theme-brand outline-none text-right"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        {isPending ? (
          <div className="flex gap-2">
            <button onClick={onSkip} className="flex-1 py-2.5 rounded-xl bg-theme-bg border border-theme-soft text-theme-secondary font-bold text-xs uppercase">
              {t('digitizeSkip')}
            </button>
            <button onClick={() => onConfirm(draft)} className="flex-1 py-2.5 rounded-xl bg-theme-brand text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5">
              <Check size={14} /> {t('digitizeConfirmSave')}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-theme-secondary opacity-70">
            {status === 'saved' ? <Check size={14} className="text-emerald-400" /> : <XIcon size={14} />}
            {status === 'saved' ? t('digitizeConfirmSave') : t('digitizeSkip')}
          </div>
        )}
      </div>
    </div>
  );
};
