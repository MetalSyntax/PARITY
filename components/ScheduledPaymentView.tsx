import React, { useState } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2 } from 'lucide-react';
import { Language, Currency, ScheduledPayment } from '../types';
import { getTranslation } from '../i18n';

interface ScheduledPaymentViewProps {
  onBack: () => void;
  lang: Language;
}

// Mock Data local to component for demo
const MOCK_SCHEDULED: ScheduledPayment[] = [
    { id: '1', name: 'Netflix', amount: 15.99, currency: Currency.USD, date: '2023-11-15', frequency: 'Monthly' },
    { id: '2', name: 'Gym', amount: 40, currency: Currency.USD, date: '2023-11-20', frequency: 'Monthly' }
];

export const ScheduledPaymentView: React.FC<ScheduledPaymentViewProps> = ({ onBack, lang }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [payments, setPayments] = useState<ScheduledPayment[]>(MOCK_SCHEDULED);
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
      setPayments([...payments, newPayment]);
      setIsAdding(false);
      setNewName('');
      setNewAmount('');
      setNewDate('');
  };

  const handleDelete = (id: string) => {
      setPayments(payments.filter(p => p.id !== id));
  };

  if (isAdding) {
      return (
          <div className="h-full flex flex-col p-6 animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setIsAdding(false)} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
                  <h1 className="text-xl font-bold">{t('addPayment')}</h1>
              </div>
              <div className="flex flex-col gap-6">
                  <input className="bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" placeholder="Name (e.g. Rent)" value={newName} onChange={e => setNewName(e.target.value)} />
                  <input className="bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" type="number" placeholder="Amount" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                  <input className="bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                  <button onClick={handleAdd} className="bg-indigo-600 p-4 rounded-xl font-bold">{t('save')}</button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold">{t('scheduledPayments')}</h1>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-2 bg-indigo-600 rounded-full text-white"><Plus size={20} /></button>
      </div>

      <div className="flex flex-col gap-4">
          {payments.map(p => (
              <div key={p.id} className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400">
                          <Calendar size={20} />
                      </div>
                      <div>
                          <h4 className="font-bold">{p.name}</h4>
                          <p className="text-xs text-zinc-500">{t('dueDate')}: {p.date} • {p.frequency}</p>
                      </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                      <span className="font-bold text-lg">${p.amount}</span>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 opacity-50 hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
              </div>
          ))}
          {payments.length === 0 && <p className="text-center text-zinc-500 mt-10">No payments scheduled.</p>}
      </div>
    </div>
  );
};