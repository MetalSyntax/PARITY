import React, { useState } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2 } from 'lucide-react';
import { Language, Currency, ScheduledPayment } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../constants';

interface ScheduledPaymentViewProps {
  onBack: () => void;
  lang: Language;
  scheduledPayments: ScheduledPayment[];
  onUpdateScheduledPayments: (payments: ScheduledPayment[]) => void;
}

export const ScheduledPaymentView: React.FC<ScheduledPaymentViewProps> = ({ onBack, lang, scheduledPayments, onUpdateScheduledPayments }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Payment Form State
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');

  const handleAdd = () => {
      if(!newName || !newAmount || !newDate) return;
      const newPayment: ScheduledPayment = {
          id: Math.random().toString(),
          name: newName,
          amount: parseFloat(newAmount),
          currency: Currency.USD, // Defaulting for demo
          date: newDate,
          frequency: 'Monthly'
      };
      onUpdateScheduledPayments([...scheduledPayments, newPayment]);
      setIsAdding(false);
      setNewName('');
      setNewAmount('');
      setNewDate('');
  };

  const handleDelete = (id: string) => {
      onUpdateScheduledPayments(scheduledPayments.filter(p => p.id !== id));
  };

  if (isAdding) {
      return (
          <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto bg-theme-bg">
              <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setIsAdding(false)} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
                  <h1 className="text-xl font-bold text-theme-primary">{t('addPayment')}</h1>
              </div>
              <div className="flex flex-col gap-6">
                  <div>
                      <label className="text-xs text-zinc-500 mb-2 block">{t('category')}</label>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-4">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat.id} 
                                onClick={() => setNewName(t(cat.name))}
                                className="flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-xl bg-theme-surface border border-white/5 text-theme-secondary hover:bg-white/5 hover:text-theme-primary transition-colors"
                            >
                                <div className="mb-1">{cat.icon}</div>
                                <span className="text-[9px] truncate max-w-[50px]">{t(cat.name)}</span>
                            </button>
                        ))}
                      </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">{t('name')}</label>
                    <input className="w-full bg-theme-surface border border-white/10 p-4 rounded-xl text-theme-primary outline-none" placeholder={t('paymentNamePlaceholder')} value={newName} onChange={e => setNewName(e.target.value)} />
                  </div>
                  
                  <div>
                     <label className="text-xs text-zinc-500 mb-1 block">{t('amount')}</label>
                     <input className="w-full bg-theme-surface border border-white/10 p-4 rounded-xl text-theme-primary outline-none" type="number" placeholder={t('amount')} value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                  </div>

                  <div>
                     <label className="text-xs text-zinc-500 mb-1 block">{t('dueDate')}</label>
                     <input className="w-full bg-theme-surface border border-white/10 p-4 rounded-xl text-theme-primary outline-none" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                  </div>
                  
                  <button onClick={handleAdd} className="bg-theme-brand p-4 rounded-xl font-bold text-white shadow-lg mt-4">{t('save')}</button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto bg-theme-bg">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-theme-primary">{t('scheduledPayments')}</h1>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-2 bg-theme-brand rounded-full text-white shadow-lg"><Plus size={20} /></button>
      </div>

      <div className="flex flex-col gap-4">
          {scheduledPayments.map(p => (
              <div key={p.id} className="bg-theme-surface p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-theme-brand">
                          <Calendar size={20} />
                      </div>
                      <div>
                          <h4 className="font-bold text-theme-primary">{p.name}</h4>
                          <p className="text-xs text-theme-secondary">{t('dueDate')}: {p.date} • {p.frequency}</p>
                      </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                      <span className="font-bold text-lg text-theme-primary">${p.amount}</span>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 opacity-50 hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
              </div>
          ))}
          {scheduledPayments.length === 0 && <p className="text-center text-theme-secondary mt-10">{t('noPaymentsScheduled')}</p>}
      </div>
    </div>
  );
};