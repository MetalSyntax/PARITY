import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, BellOff, Calendar, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { ScheduledPayment, Language, Currency, TransactionType } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';

interface ScheduledNotificationsViewProps {
  onBack: () => void;
  lang: Language;
  scheduledPayments: ScheduledPayment[];
  onUpdateScheduledPayments: (payments: ScheduledPayment[]) => void;
  notificationsEnabled: boolean;
  onToggleGlobalNotifications: (enabled: boolean) => void;
}

export const ScheduledNotificationsView: React.FC<ScheduledNotificationsViewProps> = ({
  onBack,
  lang,
  scheduledPayments,
  onUpdateScheduledPayments,
  notificationsEnabled,
  onToggleGlobalNotifications
}) => {
  const t = (key: any) => getTranslation(lang, key);

  const togglePaymentNotification = (p: ScheduledPayment) => {
    const updated = scheduledPayments.map(payment => 
      payment.id === p.id 
        ? { ...payment, notificationsEnabled: payment.notificationsEnabled === false ? true : false } 
        : payment
    );
    onUpdateScheduledPayments(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col p-6 bg-theme-bg overflow-y-auto no-scrollbar"
    >
      <div className="flex items-center gap-4 mb-8">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
           <h1 className="text-xl font-bold text-theme-primary">{t('scheduledNotifications')}</h1>
           <p className="text-xs text-theme-secondary font-medium">{t('notificationsSubtitle') || 'Configuración de alertas inteligentes'}</p>
        </div>
      </div>

      {/* Global Toggle */}
      <div className="bg-theme-surface border border-theme-soft rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${notificationsEnabled ? 'bg-theme-brand/10 text-theme-brand' : 'bg-theme-soft text-theme-secondary'}`}>
              {notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-theme-primary">{t('overallNotifications')}</h3>
              <p className="text-[10px] font-black text-theme-secondary uppercase tracking-widest opacity-60">
                {notificationsEnabled ? t('active') : t('inactive')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onToggleGlobalNotifications(!notificationsEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? "bg-theme-brand" : "bg-theme-soft"}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? "left-7" : "left-1"}`} />
          </button>
        </div>
      </div>

      <p className="text-[10px] font-black text-theme-secondary uppercase tracking-widest mb-4 px-1">{t('personalizedAlerts')}</p>

      <div className="space-y-3">
        {scheduledPayments.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-theme-soft rounded-2xl bg-theme-surface/30">
            <p className="text-sm text-theme-secondary font-bold">{t('noScheduledForNotifications')}</p>
          </div>
        ) : (
          scheduledPayments.map(p => {
            const isEnabled = p.notificationsEnabled !== false;
            const category = CATEGORIES.find(c => c.id === p.category);
            
            return (
              <motion.div 
                key={p.id}
                layout
                className={`bg-theme-surface border p-4 rounded-2xl flex items-center justify-between transition-all ${isEnabled && notificationsEnabled ? 'border-theme-soft shadow-sm' : 'border-white/5 opacity-60 grayscale'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category?.color || 'bg-white/5'} bg-opacity-10 text-theme-primary`}>
                    {category?.icon || <Calendar size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-theme-primary">{p.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={10} className="text-theme-secondary" />
                      <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-tight">
                        {t(p.frequency.toLowerCase()) || p.frequency} • {new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => togglePaymentNotification(p)}
                  className={`p-3 rounded-xl transition-all ${isEnabled ? 'bg-theme-brand/10 text-theme-brand' : 'bg-theme-soft text-theme-secondary'}`}
                >
                  {isEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {notificationsEnabled && scheduledPayments.length > 0 && (
         <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
               <CheckCircle2 size={16} />
            </div>
            <div>
               <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">{t('smartAlertsActive')}</h4>
               <p className="text-[10px] font-bold text-emerald-400/70 leading-relaxed uppercase tracking-tight">
                  {t('smartAlertsDesc')}
               </p>
            </div>
         </div>
      )}
    </motion.div>
  );
};
