import React from 'react';
import { ScanText, Cpu, Cloud } from 'lucide-react';
import { OcrProviderId, Language } from '@parity/core';
import { getTranslation } from '@parity/i18n';

interface OcrProviderChooserProps {
  value: OcrProviderId;
  onChange: (id: OcrProviderId) => void;
  azureAvailable: boolean;
  lang: Language;
  /** When set, shows a warning below the options with this many images leaving the device if Azure is picked. */
  cloudImageCount?: number;
  /** Overrides the heading — defaults to the batch-run wording. */
  label?: string;
}

/**
 * The 3 selectable OCR engines, shared by the live-capture menu (AddTransaction),
 * the batch migration tool, and the single-receipt quick-digitize flow so the
 * choice always looks and behaves the same everywhere it appears.
 */
export const OcrProviderChooser: React.FC<OcrProviderChooserProps> = ({ value, onChange, azureAvailable, lang, cloudImageCount, label }) => {
  const t = (key: any) => getTranslation(lang, key);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-theme-secondary uppercase tracking-widest opacity-60">{label ?? t('digitizeChooseProvider')}</p>

      <button
        onClick={() => onChange('tesseract')}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors text-left ${value === 'tesseract' ? 'border-theme-brand bg-theme-brand/10' : 'border-theme-soft bg-theme-surface'}`}
      >
        <ScanText size={18} className="text-theme-brand flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-theme-primary">{t('digitizeProviderTesseract')}</p>
          <p className="text-[11px] text-theme-secondary opacity-60">{t('digitizeProviderTesseractDesc')}</p>
        </div>
      </button>

      <button
        onClick={() => onChange('paddleocr')}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors text-left ${value === 'paddleocr' ? 'border-theme-brand bg-theme-brand/10' : 'border-theme-soft bg-theme-surface'}`}
      >
        <Cpu size={18} className="text-theme-brand flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-theme-primary">{t('digitizeProviderLocal')}</p>
          <p className="text-[11px] text-theme-secondary opacity-60">{t('digitizeProviderLocalDesc')}</p>
        </div>
      </button>

      <button
        onClick={() => azureAvailable && onChange('azure_doc_intelligence')}
        disabled={!azureAvailable}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors text-left ${value === 'azure_doc_intelligence' ? 'border-theme-brand bg-theme-brand/10' : 'border-theme-soft bg-theme-surface'} ${!azureAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <Cloud size={18} className="text-blue-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-theme-primary">{t('digitizeProviderCloud')}</p>
          <p className="text-[11px] text-theme-secondary opacity-60">{t('digitizeProviderCloudDesc')}</p>
        </div>
      </button>

      {value === 'azure_doc_intelligence' && cloudImageCount !== undefined && (
        <p className="text-[11px] text-yellow-400 font-bold px-1">
          {cloudImageCount} {t('digitizeCloudWarning')}
        </p>
      )}
    </div>
  );
};
