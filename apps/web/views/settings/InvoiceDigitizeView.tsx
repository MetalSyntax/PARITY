import React, { useMemo, useState } from 'react';
import { ChevronLeft, FileSearch, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, UserProfile, InvoiceData, OcrProviderId } from '@parity/core';
import { getTranslation } from '@parity/i18n';
import { createWebInvoiceOcr } from '../../services/invoiceOcrClient';
import { OcrProviderChooser } from './OcrProviderChooser';
import { InvoiceReviewCard } from './InvoiceReviewCard';

interface InvoiceDigitizeViewProps {
  onBack: () => void;
  transactions: Transaction[];
  onUpdateTransaction: (tx: Transaction) => void;
  userProfile: UserProfile;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Stage = 'INVENTORY' | 'RUNNING' | 'REVIEW';

interface ReviewItem {
  transaction: Transaction;
  invoiceData: InvoiceData;
  status: 'pending' | 'saved' | 'skipped';
}

export const InvoiceDigitizeView: React.FC<InvoiceDigitizeViewProps> = ({ onBack, transactions, onUpdateTransaction, userProfile, showAlert }) => {
  const t = (key: any) => getTranslation(userProfile.language, key);

  // Section 6: inventory is always recomputed from live data, so an interrupted
  // batch naturally "resumes" — anything not yet committed in Review is still
  // missing invoiceData and reappears here on next open.
  const pending = useMemo(() => transactions.filter(tx => tx.receipt && !tx.invoiceData), [transactions]);
  const totalWithReceipt = useMemo(() => transactions.filter(tx => tx.receipt).length, [transactions]);

  const azureAvailable = Boolean(userProfile.ocrCloudEnabled && userProfile.ocrAzureEndpoint && userProfile.ocrAzureApiKey);

  const [stage, setStage] = useState<Stage>('INVENTORY');
  const [providerId, setProviderId] = useState<OcrProviderId>('tesseract');
  const [runIndex, setRunIndex] = useState(0);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  const startBatch = async () => {
    setStage('RUNNING');
    setRunIndex(0);
    const azureConfig = providerId === 'azure_doc_intelligence'
      ? { endpoint: userProfile.ocrAzureEndpoint!, apiKey: userProfile.ocrAzureApiKey!, model: userProfile.ocrAzureModel }
      : undefined;
    const invoiceOcr = createWebInvoiceOcr(azureConfig);

    const results: ReviewItem[] = [];
    for (let i = 0; i < pending.length; i++) {
      setRunIndex(i + 1);
      const tx = pending[i];
      try {
        const invoiceData = await invoiceOcr.extract(tx.receipt as string, providerId);
        results.push({ transaction: tx, invoiceData, status: 'pending' });
      } catch (err) {
        console.error('Batch OCR failed for transaction', tx.id, err);
      }
    }
    setReviewItems(results);
    setStage('REVIEW');
  };

  const commitItem = (item: ReviewItem, data: InvoiceData) => {
    onUpdateTransaction({ ...item.transaction, invoiceData: data });
    setReviewItems(prev => prev.map(r => r.transaction.id === item.transaction.id ? { ...r, status: 'saved' } : r));
  };

  const skipItem = (item: ReviewItem) => {
    setReviewItems(prev => prev.map(r => r.transaction.id === item.transaction.id ? { ...r, status: 'skipped' } : r));
  };

  const allReviewed = reviewItems.length > 0 && reviewItems.every(r => r.status !== 'pending');

  const renderInventory = () => (
    <div className="p-6 space-y-6">
      <div className="bg-theme-surface border border-theme-soft rounded-2xl p-6 text-center">
        <FileSearch size={32} className="mx-auto mb-3 text-theme-brand" />
        {pending.length === 0 ? (
          <p className="text-sm font-bold text-theme-secondary">
            {totalWithReceipt === 0 ? t('digitizeNoReceiptsAtAll') : t('digitizeNonePending')}
          </p>
        ) : (
          <p className="text-2xl font-black text-theme-primary">
            {pending.length} <span className="text-sm font-bold text-theme-secondary">{t('digitizeInventoryCount')}</span>
          </p>
        )}
      </div>

      {pending.length > 0 && (
        <>
          <OcrProviderChooser
            value={providerId}
            onChange={setProviderId}
            azureAvailable={azureAvailable}
            lang={userProfile.language}
            cloudImageCount={pending.length}
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={startBatch}
            className="w-full py-4 rounded-2xl bg-theme-brand text-white font-black text-sm uppercase tracking-wide"
          >
            {t('digitizeStartBatch')}
          </motion.button>
        </>
      )}
    </div>
  );

  const renderRunning = () => (
    <div className="p-6 flex flex-col items-center justify-center gap-4 h-full">
      <Loader2 size={40} className="animate-spin text-theme-brand" />
      <p className="text-sm font-bold text-theme-primary">{t('digitizeProcessing')} {runIndex}/{pending.length}</p>
    </div>
  );

  const renderReview = () => (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-black text-theme-primary">{t('digitizeReviewTitle')}</h3>
        <p className="text-xs text-theme-secondary opacity-60">{t('digitizeReviewDesc')}</p>
      </div>

      {reviewItems.map(item => (
        <InvoiceReviewCard
          key={item.transaction.id}
          transaction={item.transaction}
          invoiceData={item.invoiceData}
          lang={userProfile.language}
          status={item.status}
          onConfirm={(data) => commitItem(item, data)}
          onSkip={() => skipItem(item)}
        />
      ))}

      {allReviewed && (
        <button onClick={onBack} className="w-full py-4 rounded-2xl bg-theme-surface border border-theme-soft text-theme-primary font-black text-sm uppercase">
          {t('digitizeDone')}
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-theme-bg z-50 overflow-y-auto">
      <div className="sticky top-0 bg-theme-bg/95 backdrop-blur-sm border-b border-theme-soft px-4 py-4 flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-base font-black text-theme-primary">{t('digitizeInvoices')}</h2>
          <p className="text-[11px] text-theme-secondary opacity-60">{t('digitizeInvoicesDesc')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {stage === 'INVENTORY' && renderInventory()}
          {stage === 'RUNNING' && renderRunning()}
          {stage === 'REVIEW' && renderReview()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
