import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, UserProfile, InvoiceData, OcrProviderId } from '@parity/core';
import { getTranslation } from '@parity/i18n';
import { createWebInvoiceOcr } from '../../services/invoiceOcrClient';
import { OcrProviderChooser } from './OcrProviderChooser';
import { InvoiceReviewCard } from './InvoiceReviewCard';

interface InvoiceQuickDigitizeModalProps {
  transaction: Transaction;
  userProfile: UserProfile;
  isDevMode?: boolean;
  onClose: () => void;
  onUpdateTransaction: (tx: Transaction) => void;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Stage = 'CHOOSE' | 'RUNNING' | 'REVIEW';

/**
 * Per-invoice digitize action from the Transactions → Invoices tab — same engine
 * choice and review UI as the batch tool (InvoiceDigitizeView), just scoped to
 * one receipt instead of iterating the whole pending inventory.
 */
export const InvoiceQuickDigitizeModal: React.FC<InvoiceQuickDigitizeModalProps> = ({ transaction, userProfile, isDevMode, onClose, onUpdateTransaction, showAlert }) => {
  const t = (key: any) => getTranslation(userProfile.language, key);
  const azureAvailable = Boolean(isDevMode && userProfile.ocrCloudEnabled && userProfile.ocrAzureEndpoint && userProfile.ocrAzureApiKey);

  const [stage, setStage] = useState<Stage>('CHOOSE');
  const [providerId, setProviderId] = useState<OcrProviderId>('tesseract');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const runAnalyze = async () => {
    if (!transaction.receipt) return;
    setStage('RUNNING');
    const azureConfig = providerId === 'azure_doc_intelligence'
      ? { endpoint: userProfile.ocrAzureEndpoint!, apiKey: userProfile.ocrAzureApiKey!, model: userProfile.ocrAzureModel }
      : undefined;
    try {
      const invoiceOcr = createWebInvoiceOcr(azureConfig);
      const data = await invoiceOcr.extract(transaction.receipt, providerId);
      setInvoiceData(data);
      setStage('REVIEW');
    } catch (err) {
      console.error('Quick digitize failed', err);
      showAlert(t('alert_ocrFailed'), 'error');
      setStage('CHOOSE');
    }
  };

  const handleConfirm = (data: InvoiceData) => {
    onUpdateTransaction({ ...transaction, invoiceData: data });
    onClose();
  };

  // Portaled to <body> — this modal is opened from within a motion.div-wrapped
  // view (TransactionsListView), and framer-motion's inline transform on that
  // ancestor creates a new stacking context that no z-index here could escape.
  return createPortal(
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-theme-bg w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-theme-bg/95 backdrop-blur-sm border-b border-theme-soft px-4 py-4 flex items-center justify-between gap-3 z-10">
          <h2 className="text-base font-black text-theme-primary">{t('digitizeSingleTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'CHOOSE' && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
              {transaction.receipt && (
                <img src={transaction.receipt} alt="receipt" className="max-h-64 w-full object-contain rounded-2xl border border-theme-soft" />
              )}
              <OcrProviderChooser
                value={providerId}
                onChange={setProviderId}
                azureAvailable={azureAvailable}
                lang={userProfile.language}
                cloudImageCount={1}
                label={t('digitizeChooseEngine')}
              />
              <button
                onClick={runAnalyze}
                className="w-full py-4 rounded-2xl bg-theme-brand text-white font-black text-sm uppercase tracking-wide"
              >
                {t('digitizeAnalyze')}
              </button>
            </motion.div>
          )}

          {stage === 'RUNNING' && (
            <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 flex flex-col items-center justify-center gap-4">
              <Loader2 size={40} className="animate-spin text-theme-brand" />
              <p className="text-sm font-bold text-theme-primary">{t('digitizeProcessing')}</p>
            </motion.div>
          )}

          {stage === 'REVIEW' && invoiceData && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <InvoiceReviewCard
                transaction={transaction}
                invoiceData={invoiceData}
                lang={userProfile.language}
                status="pending"
                onConfirm={handleConfirm}
                onSkip={onClose}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
};
