import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Plus, Maximize2, Receipt, Info, Camera, Trash2, Edit2, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';
import { Transaction, TransactionType, Currency, Language } from '../types';
import { CATEGORIES } from '../constants';
import { getTranslation } from '../i18n';

interface TransactionDetailModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (t: Transaction) => void;
  onUpdateTransaction?: (t: Transaction) => void;
  language: Language;
  exchangeRate?: number;
  displayCurrency: Currency;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onUpdateTransaction,
  language,
  exchangeRate,
  displayCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'invoice'>('summary');
  const [showLightbox, setShowLightbox] = useState(false);

  // Crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 20, y: 30, width: 60, height: 40 });
  const imgRef = React.useRef<HTMLImageElement>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const t = (key: any) => getTranslation(language, key);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('summary');
    }
  }, [isOpen, transaction?.id]);

  if (!isOpen) return null;

  const category = CATEGORIES.find(c => c.id === transaction.category) || CATEGORIES[0];

  const getSymbol = (cur: Currency) => {
    if (cur === Currency.USD || cur === Currency.USDT) return '$';
    if (cur === Currency.EUR) return '€';
    return 'Bs.';
  };

  const isUSD = (cur: Currency) => cur === Currency.USD || cur === Currency.USDT;

  const calculateAmount = (cur: Currency, tx: Transaction, currentER?: number) => {
    const rate = currentER || tx.exchangeRate || 1;
    if (cur === Currency.VES) return tx.normalizedAmountUSD * rate;
    if (cur === Currency.EUR) return (tx.normalizedAmountUSD * rate) / (tx.euroRate || 1);
    return tx.normalizedAmountUSD;
  };

  const mainAmount = transaction.amount;
  const isOriginalUSD = transaction.originalCurrency === Currency.USD;

  const renderSummary = () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-theme-bg/50 rounded-3xl p-6 border border-white/5">
        <div className="text-center mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-theme-secondary mb-2">{t('amount')}</p>
          <h2 className={`text-4xl font-black ${transaction.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-theme-primary'}`}>
            {transaction.type === TransactionType.INCOME ? '+' : '-'}
            {(transaction.originalCurrency === Currency.USD || transaction.originalCurrency === Currency.USDT) ? '$' : transaction.originalCurrency === Currency.EUR ? '€' : 'Bs.'}
            {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          {displayCurrency !== transaction.originalCurrency && !(isUSD(displayCurrency) && isUSD(transaction.originalCurrency)) && (
            <p className="text-sm text-theme-secondary mt-1 font-mono">
              ≈ {getSymbol(displayCurrency)} {
                calculateAmount(displayCurrency, transaction, exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })
              }
            </p>
          )}
        </div>

        <div className="grid gap-4 pt-4 border-t border-white/5">
          {transaction.note && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-theme-secondary opacity-50">{t('notePlaceholder').replace('...', '')}</span>
              <p className="text-sm text-theme-primary leading-relaxed">{transaction.note}</p>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-secondary opacity-50">{t('type')}</span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${transaction.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-400' :
                transaction.type === TransactionType.EXPENSE ? 'bg-red-500/10 text-red-500' :
                  'bg-blue-500/10 text-blue-400'
              }`}>
              {t(transaction.type.toLowerCase())}
            </span>
          </div>

          {transaction.fee !== undefined && transaction.fee > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-theme-secondary opacity-50">{t('commissions')}</span>
              <span className="text-red-400 font-bold">{transaction.fee.toLocaleString()} {getSymbol(transaction.originalCurrency)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateTransaction) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCrop = () => {
    if (!imgRef.current || !selectedImage) return;

    const canvas = document.createElement('canvas');
    const img = imgRef.current;

    // Calculate actual pixel coordinates
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const x = (cropBox.x * img.clientWidth / 100) * scaleX;
    const y = (cropBox.y * img.clientHeight / 100) * scaleY;
    const width = (cropBox.width * img.clientWidth / 100) * scaleX;
    const height = (cropBox.height * img.clientHeight / 100) * scaleY;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
      if (onUpdateTransaction) {
        onUpdateTransaction({
          ...transaction,
          receipt: croppedBase64
        });
      }
      setShowCropModal(false);
      setSelectedImage(null);
    }
  };

  const removeReceipt = () => {
    if (onUpdateTransaction) {
      onUpdateTransaction({
        ...transaction,
        receipt: undefined
      });
      setActiveTab('summary');
    }
  };

  const renderInvoice = () => (
    <div className="flex flex-col gap-6 p-6 h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="flex flex-col gap-3 h-full">
        {transaction.receipt ? (
          <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[4/3] flex-1">
            <img
              src={transaction.receipt}
              alt="Receipt"
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => setShowLightbox(true)}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setShowLightbox(true)}
                className="p-3 bg-black/50 backdrop-blur-md text-white rounded-xl hover:bg-theme-brand transition-colors shadow-lg border border-white/10"
              >
                <Maximize2 size={20} />
              </button>
              <button
                onClick={() => {
                  setSelectedImage(transaction.receipt as string);
                  setShowCropModal(true);
                }}
                className="p-3 bg-theme-brand text-white rounded-xl shadow-lg hover:brightness-110 transition-all border border-white/10"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-blue-500/80 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-all border border-white/10"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={removeReceipt}
                className="p-3 bg-red-500/80 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all border border-white/10"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-theme-secondary bg-theme-bg/30 rounded-3xl border border-dashed border-white/10 h-full">
            <div className="w-20 h-20 rounded-full bg-theme-surface flex items-center justify-center mb-4 text-theme-secondary opacity-20">
              <ImageIcon size={40} />
            </div>
            <p className="text-sm font-bold mb-6">{t('noReceipt') || 'Sin factura adjunta'}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-theme-brand text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Camera size={16} />
              {t('addReceipt') || 'Agregar Factura'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-theme-surface w-full max-w-lg rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-0 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${category.color} bg-opacity-20`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-theme-primary leading-tight">
                        {t(category.name as any) || category.name}
                      </h3>
                      <p className="text-sm text-theme-secondary">
                        {new Date(transaction.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-theme-secondary transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {transaction.receipt && (
                  <div className="flex p-1 bg-theme-bg/50 rounded-2xl border border-white/5 mt-2">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'summary' ? 'bg-theme-surface text-theme-brand shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
                    >
                      <Info size={14} />
                      {t('summary') || 'Resumen'}
                    </button>
                    <button
                      onClick={() => setActiveTab('invoice')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'invoice' ? 'bg-theme-surface text-theme-brand shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
                    >
                      <Receipt size={14} />
                      {t('receipt') || 'Factura'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ x: activeTab === 'summary' ? -20 : 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: activeTab === 'summary' ? 20 : -20, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="h-full"
                  >
                    {activeTab === 'summary' ? renderSummary() : renderInvoice()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onEdit(transaction);
                  }}
                  className="flex-1 py-4 bg-theme-surface border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] text-theme-primary hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp size={14} className="text-theme-brand" />
                  {t('edit')}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-theme-brand rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-brand/20 transition-all"
                >
                  {t('done')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && transaction.receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-4 pb-28 md:p-8"
            onClick={() => setShowLightbox(false)}
          >
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 pointer-events-none">
              <div className="pointer-events-auto">
                <h4 className="text-white font-bold text-lg drop-shadow-lg">{t('receipt')}</h4>
                <p className="text-white/60 text-sm drop-shadow-md">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setShowLightbox(false)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all pointer-events-auto backdrop-blur-md border border-white/10"
              >
                <X size={24} />
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={transaction.receipt}
                alt="Receipt Fullscreen"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            </motion.div>

            <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
              <a
                href={transaction.receipt}
                download={`receipt_${transaction.id}.jpg`}
                className="px-8 py-3 bg-theme-brand text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 border border-white/10"
              >
                <Plus size={18} />
                {t('download') || 'Descargar'}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Crop Modal */}
      <AnimatePresence>
        {showCropModal && selectedImage && (
          <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col p-4 pb-[100px] animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest">{t('selectTotalSection') || 'Recortar Factura'}</h3>
              <button onClick={() => { setShowCropModal(false); setSelectedImage(null); }} className="p-2 bg-white/10 rounded-full text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10">
              <img
                ref={imgRef}
                src={selectedImage}
                className="max-w-full max-h-full object-contain pointer-events-none"
                alt="Crop Preview"
              />

              {/* Selection Overlay */}
              <div
                className="absolute border-2 border-theme-soft shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move rounded-lg"
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const startX = touch.clientX;
                  const startY = touch.clientY;
                  const initialX = cropBox.x;
                  const initialY = cropBox.y;

                  const onMove = (moveEvent: TouchEvent) => {
                    const moveTouch = moveEvent.touches[0];
                    const dx = ((moveTouch.clientX - startX) / window.innerWidth) * 100;
                    const dy = ((moveTouch.clientY - startY) / window.innerHeight) * 100;
                    setCropBox(prev => ({
                      ...prev,
                      x: Math.max(0, Math.min(100 - prev.width, initialX + dx)),
                      y: Math.max(0, Math.min(100 - prev.height, initialY + dy))
                    }));
                  };

                  const onEnd = () => {
                    window.removeEventListener('touchmove', onMove);
                    window.removeEventListener('touchend', onEnd);
                  };

                  window.addEventListener('touchmove', onMove);
                  window.addEventListener('touchend', onEnd);
                }}
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const initialX = cropBox.x;
                  const initialY = cropBox.y;

                  const onMove = (moveEvent: MouseEvent) => {
                    const dx = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
                    const dy = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
                    setCropBox(prev => ({
                      ...prev,
                      x: Math.max(0, Math.min(100 - prev.width, initialX + dx)),
                      y: Math.max(0, Math.min(100 - prev.height, initialY + dy))
                    }));
                  };

                  const onEnd = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onEnd);
                  };

                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onEnd);
                }}
              >
                <div className="absolute inset-0 border-2 border-white/30 rounded-lg animate-pulse" />

                {/* Resize Handle (Bottom Right) */}
                <div
                  className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center cursor-nwse-resize"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    const touch = e.touches[0];
                    const startX = touch.clientX;
                    const startY = touch.clientY;
                    const initialW = cropBox.width;
                    const initialH = cropBox.height;

                    const onMove = (moveEvent: TouchEvent) => {
                      const moveTouch = moveEvent.touches[0];
                      const dw = ((moveTouch.clientX - startX) / window.innerWidth) * 100;
                      const dh = ((moveTouch.clientY - startY) / window.innerHeight) * 100;
                      setCropBox(prev => ({
                        ...prev,
                        width: Math.max(10, Math.min(100 - prev.x, initialW + dw)),
                        height: Math.max(5, Math.min(100 - prev.y, initialH + dh))
                      }));
                    };

                    const onEnd = () => {
                      window.removeEventListener('touchmove', onMove);
                      window.removeEventListener('touchend', onEnd);
                    };

                    window.addEventListener('touchmove', onMove);
                    window.addEventListener('touchend', onEnd);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const initialW = cropBox.width;
                    const initialH = cropBox.height;

                    const onMove = (moveEvent: MouseEvent) => {
                      const dw = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
                      const dh = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
                      setCropBox(prev => ({
                        ...prev,
                        width: Math.max(10, Math.min(100 - prev.x, initialW + dw)),
                        height: Math.max(5, Math.min(100 - prev.y, initialH + dh))
                      }));
                    };

                    const onEnd = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onEnd);
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onEnd);
                  }}
                >
                  <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={handleApplyCrop}
                className="w-full py-4 bg-theme-brand text-white font-bold rounded-2xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all uppercase text-xs"
              >
                <Check size={18} />
                {t('save') || 'Guardar Recorte'}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
