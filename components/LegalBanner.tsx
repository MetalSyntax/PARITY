import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, ChevronRight } from 'lucide-react';
import { getTranslation } from '../i18n';
import { Language } from '../types';

interface LegalBannerProps {
    lang: Language;
}

export const LegalBanner: React.FC<LegalBannerProps> = ({ lang }) => {
    const [isVisible, setIsVisible] = useState(false);
    const t = (key: any) => getTranslation(lang, key);

    useEffect(() => {
        const consent = localStorage.getItem('parity_gdpr_consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('parity_gdpr_consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 md:left-auto md:right-10 md:w-96 z-[60]"
                >
                    <div className="bg-theme-surface/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-theme-brand/20 flex items-center justify-center text-theme-brand">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="font-black text-theme-primary tracking-tight">
                                {t('gdprTitle') || 'Privacy & Data'}
                            </h3>
                        </div>
                        <p className="text-xs text-theme-secondary leading-relaxed font-bold opacity-80">
                            {t('gdprDesc') || 'We use local storage to keep your financial data secure and private on this device. No data is shared with third parties.'}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAccept}
                                className="flex-1 bg-theme-brand text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-brand/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {t('accept') || 'Accept'} <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
