import React, { useState } from 'react';
import { Target, ShieldCheck, CloudDownload, ArrowRight } from 'lucide-react';
import { getTranslation } from '../i18n';
import { Language } from '../types';

interface OnboardingProps {
    lang: Language;
    onStartFresh: () => void;
    onSyncFromCloud: () => void;
    isSyncing: boolean;
}

export const Onboarding: React.FC<OnboardingProps> = ({ lang, onStartFresh, onSyncFromCloud, isSyncing }) => {
    const [step, setStep] = useState(0);
    const t = (key: any) => getTranslation(lang, key);

    const slides = [
        {
            title: t('onboarding_title1'),
            desc: t('onboarding_desc1'),
            icon: <Target size={80} className="text-theme-brand" />,
            color: 'from-theme-brand/20 to-purple-500/20'
        },
        {
            title: t('onboarding_title2'),
            desc: t('onboarding_desc2'),
            icon: <ShieldCheck size={80} className="text-emerald-400" />,
            color: 'from-emerald-500/20 to-cyan-500/20'
        },
        {
            title: t('onboarding_title3'),
            desc: t('onboarding_desc3'),
            icon: <CloudDownload size={80} className="text-blue-400" />,
            color: 'from-blue-500/20 to-indigo-500/20'
        }
    ];

    const currentSlide = slides[step];

    return (
        <div className="fixed inset-0 z-[200] bg-theme-bg flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-b ${currentSlide.color} opacity-30 transition-all duration-1000`} />
            
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className="mb-12 transition-all duration-500 transform hover:scale-105">
                    <div className="w-40 h-40 rounded-[3rem] bg-theme-surface border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-theme-brand/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div key={step} className="animate-in zoom-in-50 duration-500">
                             {currentSlide.icon}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="h-[200px] flex flex-col items-center">
                    <div key={`content-${step}`} className="animate-in slide-in-from-right duration-500 flex flex-col items-center">
                        <h1 className="text-3xl font-black text-theme-primary mb-4 tracking-tight leading-tight">
                            {currentSlide.title}
                        </h1>
                        <p className="text-theme-secondary text-lg mb-8 px-4 opacity-80 leading-relaxed font-medium">
                            {currentSlide.desc}
                        </p>
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2 mb-12">
                    {slides.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-theme-brand' : 'w-2 bg-white/10'}`} 
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-4">
                    {step < 2 ? (
                        <button 
                            onClick={() => setStep(step + 1)}
                            className="w-full bg-theme-primary text-theme-bg font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-black/20"
                        >
                            {t('viewMore')} <ArrowRight size={20} />
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={onStartFresh}
                                className="w-full bg-theme-primary text-theme-bg font-black py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-black/20"
                            >
                                {t('startFromScratch')}
                            </button>
                            <button 
                                onClick={onSyncFromCloud}
                                disabled={isSyncing}
                                className={`w-full py-4 rounded-2xl font-black transition-all border-2 flex items-center justify-center gap-2 ${
                                    isSyncing 
                                    ? 'bg-theme-brand/10 border-theme-brand/50 text-theme-brand animate-pulse' 
                                    : 'bg-white/5 border-white/10 text-theme-primary hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <CloudDownload size={20} className="text-theme-brand" />
                                {isSyncing ? t('fetching') : t('restoreFromCloudLong')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
