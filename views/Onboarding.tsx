import React, { useState } from 'react';
import { Target, ShieldCheck, CloudDownload, ArrowRight, Wallet, BarChart3, Rocket, X, Globe, Eye, EyeOff, Layout, Star, CheckCircle2, List, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '../i18n';
import { Language, Currency, UserProfile } from '../types';
import { Button, IconButton, Typography, Input, SegmentedControl, ToggleSwitch, Card } from '../components/ui';

interface OnboardingInitialData {
    profile: Partial<UserProfile>;
    displayCurrency: Currency;
    isBalanceVisible: boolean;
    navbarFavorites: string[];
}

interface OnboardingProps {
    lang: Language;
    onStartFresh: (data: OnboardingInitialData) => void;
    onSyncFromCloud: () => void;
    isSyncing: boolean;
    isDevMode: boolean;
}

export const Onboarding: React.FC<OnboardingProps> = ({ lang: initialLang, onStartFresh, onSyncFromCloud, isSyncing, isDevMode }) => {
    const [step, setStep] = useState(0);
    
    // Configuración local que se enviará al finalizar
    const [name, setName] = useState('');
    const [lang, setLang] = useState<Language>(initialLang);
    const [hideBalances, setHideBalances] = useState(false);
    const [currency, setCurrency] = useState<Currency>(Currency.USD);
    const [favorites, setFavorites] = useState<string[]>(['DASHBOARD', 'TRANSACTIONS', 'BUDGET']);

    const t = (key: any) => getTranslation(lang, key);

    const toggleFavorite = (id: string) => {
        if (favorites.includes(id)) {
            if (favorites.length > 2) setFavorites(favorites.filter(f => f !== id));
        } else {
            if (favorites.length < 5) setFavorites([...favorites, id]);
        }
    };

    const handleFinish = () => {
        onStartFresh({
            profile: { name: name.trim() || 'User', language: lang },
            displayCurrency: currency,
            isBalanceVisible: !hideBalances,
            navbarFavorites: favorites,
        });
    };

    const slides = [
        {
            id: 'profile',
            title: t('onboarding_title1'),
            desc: t('onboarding_name_desc'),
            icon: <Target size={60} className="text-theme-brand" />,
            color: 'from-theme-brand/20 to-purple-500/20',
            content: (
                <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-4">
                    <Input 
                        placeholder={t('onboarding_name_placeholder')}
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="text-center text-lg"
                        autoFocus
                    />
                </div>
            )
        },
        {
            id: 'language',
            title: t('onboarding_language_title'),
            desc: t('onboarding_language_desc'),
            icon: <Globe size={60} className="text-emerald-400" />,
            color: 'from-emerald-500/20 to-cyan-500/20',
            content: (
                <div className="w-full mt-6">
                    <SegmentedControl 
                        value={lang}
                        onChange={setLang}
                        options={[
                            { label: 'Español', value: 'es' },
                            { label: 'English', value: 'en' },
                            { label: 'Português', value: 'pt' }
                        ]}
                    />
                </div>
            )
        },
        {
            id: 'privacy',
            title: t('onboarding_privacy_title'),
            desc: t('onboarding_privacy_desc'),
            icon: <ShieldCheck size={60} className="text-amber-400" />,
            color: 'from-amber-500/20 to-orange-500/20',
            content: (
                <div className="w-full mt-6 space-y-4">
                    <Card variant="surface" className="p-4 flex items-center justify-between border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                            {hideBalances ? <EyeOff size={18} className="text-theme-secondary" /> : <Eye size={18} className="text-theme-brand" />}
                            <Typography variant="small" weight="bold">{t('onboarding_hide_balances')}</Typography>
                        </div>
                        <ToggleSwitch enabled={hideBalances} onChange={setHideBalances} />
                    </Card>
                    <SegmentedControl 
                        value={currency}
                        onChange={setCurrency}
                        options={[
                            { label: 'USD ($)', value: Currency.USD },
                            { label: 'EUR (€)', value: Currency.EUR },
                            { label: 'VES (Bs)', value: Currency.VES }
                        ]}
                    />
                </div>
            )
        },
        {
            id: 'menu',
            title: t('onboarding_menu_title'),
            desc: t('onboarding_menu_desc'),
            icon: <Layout size={60} className="text-blue-400" />,
            color: 'from-blue-500/20 to-indigo-500/20',
            content: (
                <div className="grid grid-cols-2 gap-2 mt-4 max-h-[200px] overflow-y-auto no-scrollbar p-1">
                    {[
                        { id: 'DASHBOARD', label: t('dashboard'), icon: <BarChart3 size={14}/> },
                        { id: 'TRANSACTIONS', label: t('transactions'), icon: <List size={14}/> },
                        { id: 'BUDGET', label: t('budget'), icon: <Wallet size={14}/> },
                        { id: 'SCHEDULED', label: t('scheduled'), icon: <Star size={14}/> },
                        { id: 'ANALYSIS', label: t('analysis'), icon: <Layout size={14}/> },
                        { id: 'SHOPPING', label: t('shoppingList'), icon: <ShoppingCart size={14}/> }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => toggleFavorite(item.id)}
                            className={`p-3 rounded-xl border text-[10px] font-black uppercase flex items-center justify-between transition-all ${
                                favorites.includes(item.id) 
                                ? 'bg-theme-brand border-theme-brand text-white shadow-lg' 
                                : 'bg-white/5 border-white/10 text-theme-secondary'
                            }`}
                        >
                            <span className="flex items-center gap-2">{item.icon} {item.label}</span>
                            {favorites.includes(item.id) && <CheckCircle2 size={12} />}
                        </button>
                    ))}
                </div>
            )
        },
        {
            id: 'finish',
            title: t('onboarding_finish_title'),
            desc: t('onboarding_finish_desc'),
            icon: <Rocket size={60} className="text-theme-brand" />,
            color: 'from-theme-brand/20 to-pink-500/20',
            content: (
                <div className="w-full mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="text-left">
                        <Typography variant="small" weight="black" className="text-emerald-400 uppercase">{t('onboarding_profile_ready')}</Typography>
                        <Typography variant="tiny" color="secondary" className="opacity-70">{t('onboarding_profile_ready_desc')}</Typography>
                    </div>
                </div>
            )
        }
    ];

    const currentSlide = slides[step];

    return (
        <div className="fixed inset-0 z-[200] bg-theme-bg flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-b ${currentSlide.color} opacity-30 transition-all duration-1000`} />
            
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className="mb-8">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-theme-surface border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-theme-brand/10 blur-3xl rounded-full opacity-50" />
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={step}
                                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
                            >
                                 {currentSlide.icon}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[280px] w-full flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`content-${step}`}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="w-full flex flex-col items-center"
                        >
                            <Typography variant="h2" weight="black" className="mb-2 tracking-tight">
                                {currentSlide.title}
                            </Typography>
                            <Typography variant="small" color="secondary" weight="medium" className="px-6 opacity-70 leading-relaxed mb-4">
                                {currentSlide.desc}
                            </Typography>
                            {currentSlide.content}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2 mb-10 mt-4">
                    {slides.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-theme-brand' : 'w-2 bg-white/10'}`} 
                        />
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-3">
                    {step < slides.length - 1 ? (
                        <Button 
                            size="lg"
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                            onClick={() => setStep(step + 1)}
                            disabled={step === 0 && !name.trim()}
                        >
                            {t('next')} <ArrowRight size={18} className="ml-2" />
                        </Button>
                    ) : (
                        <>
                            <Button
                                size="lg"
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                                onClick={handleFinish}
                            >
                                {t('startFresh')}
                            </Button>

                            {isDevMode && (
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                                    onClick={onSyncFromCloud}
                                    isLoading={isSyncing}
                                >
                                    <CloudDownload size={18} className="mr-2" /> {t('syncFromCloud')}
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {isDevMode && (
                    <Typography variant="tiny" color="secondary" weight="black" className="mt-6 uppercase tracking-widest opacity-30">
                        {t('devModeActive')}
                    </Typography>
                )}
            </div>
        </div>
    );
};
