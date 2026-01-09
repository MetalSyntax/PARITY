import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Trash2, Check, Target, MoreHorizontal, Settings2, Trophy } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Transaction, TransactionType, Language } from '../types';
import { getTranslation } from '../i18n';

interface BudgetViewProps {
  onBack: () => void;
  transactions: Transaction[];
  lang: Language;
}

interface Budget {
  categoryId: string;
  limit: number;
  customName?: string;
  customIcon?: string;
  customColor?: string;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  icon: string;
  color: string;
}

const STORAGE_KEY_BUDGETS = 'dualflow_budgets';
const STORAGE_KEY_GOALS = 'dualflow_goals';

export const BudgetView: React.FC<BudgetViewProps> = ({ onBack, transactions, lang }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [activeTab, setActiveTab] = useState<'ENVELOPES' | 'GOALS'>('ENVELOPES');
  const [isManaging, setIsManaging] = useState(false);
  
  // Data State - Lazy Initialization for Persistence
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BUDGETS);
    try {
        return saved ? JSON.parse(saved) : [
            { categoryId: 'food', limit: 300 },
            { categoryId: 'transport', limit: 120 }
        ];
    } catch {
        return [];
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY_GOALS);
      try {
          return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Trip to Japan', targetAmount: 2500, savedAmount: 1250, deadline: '2024-12-31', icon: '🗻', color: 'from-blue-600 to-indigo-600' },
            { id: '2', name: 'Emergency Fund', targetAmount: 1000, savedAmount: 200, deadline: '2024-06-01', icon: '🆘', color: 'from-emerald-600 to-teal-600' }
          ];
      } catch {
          return [];
      }
  });
  
  // Modal/Form State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showCustomEnvelopeModal, setShowCustomEnvelopeModal] = useState(false); // New modal for custom
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // New Custom Envelope Form State
  const [customName, setCustomName] = useState('');
  const [customLimit, setCustomLimit] = useState('');
  const [customIcon, setCustomIcon] = useState('✉️');

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
  }, [goals]);

  // Logic...
  const handleUpdateLimit = (catId: string, newLimit: string) => {
      const limit = parseFloat(newLimit);
      if (isNaN(limit)) return;
      setBudgets(prev => prev.map(b => b.categoryId === catId ? { ...b, limit } : b));
  };

  const handleAddBudget = (catId: string) => {
      if (budgets.find(b => b.categoryId === catId)) return;
      setBudgets([...budgets, { categoryId: catId, limit: 100 }]);
  };

  const handleAddCustomBudget = () => {
      if (!customName || !customLimit) return;
      const newBudget: Budget = {
          categoryId: `custom_${Date.now()}`,
          limit: parseFloat(customLimit),
          customName: customName,
          customIcon: customIcon,
          customColor: 'bg-indigo-500' // Default or random
      };
      setBudgets([...budgets, newBudget]);
      setShowCustomEnvelopeModal(false);
      // Reset form
      setCustomName('');
      setCustomLimit('');
      setCustomIcon('✉️');
  };

  const handleDeleteBudget = (catId: string) => {
      setBudgets(prev => prev.filter(b => b.categoryId !== catId));
  };
  
  // ... Goal handlers (omitted for brevity, unchanged)
  const handleSaveGoal = (goal: Goal) => {
      if (editingGoal) {
          setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
      } else {
          setGoals([...goals, goal]);
      }
      setShowGoalModal(false);
      setEditingGoal(null);
  };
  const handleDeleteGoal = (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      setShowGoalModal(false);
      setEditingGoal(null);
  };

  const availableCategories = CATEGORIES.filter(c => !budgets.find(b => b.categoryId === c.id));

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-theme-secondary hover:text-theme-primary"><ArrowLeft size={20} /></button>
             <h1 className="text-xl font-bold text-theme-primary">{t('budgetsAndGoals')}</h1>
        </div>
        <div className="text-xs bg-white/5 px-3 py-1 rounded-full border border-white/10 text-theme-secondary">USD</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-theme-surface p-1 rounded-xl border border-white/5">
          <button onClick={() => { setActiveTab('ENVELOPES'); setIsManaging(false); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ENVELOPES' ? 'bg-theme-card text-theme-brand shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}>
             {t('envelopes')}
          </button>
          <button onClick={() => { setActiveTab('GOALS'); setIsManaging(false); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'GOALS' ? 'bg-theme-card text-theme-brand shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}>
             {t('goals')}
          </button>
      </div>

      {/* --- ENVELOPES VIEW --- */}
      {activeTab === 'ENVELOPES' && (
          <div className="animate-in fade-in duration-300">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-bold text-theme-primary">{t('digitalEnvelopes')}</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsManaging(!isManaging)}
                        className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${isManaging ? 'bg-theme-brand text-white' : 'text-theme-brand hover:bg-white/5'}`}
                    >
                        {isManaging ? t('done') : t('manage')}
                    </button>
                    {isManaging && (
                         <button onClick={() => setShowAddBudgetModal(true)} className="bg-theme-brand text-white p-1 rounded-full"><Plus size={16} /></button>
                    )}
                </div>
              </div>

              <div className="flex flex-col gap-4 pb-20">
                {budgets.map(budget => {
                  let cat = CATEGORIES.find(c => c.id === budget.categoryId);
                  
                  // Handle Custom Budgets which don't have a real category
                  if (!cat && budget.customName) {
                      cat = {
                          id: budget.categoryId,
                          name: budget.customName,
                          icon: budget.customIcon || '📦',
                          color: budget.customColor || 'text-indigo-400'
                      } as any;
                  }

                  if (!cat) return null;

                  const spent = transactions
                    .filter(t => t.category === cat?.id && t.type === TransactionType.EXPENSE)
                    .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
                  
                  const percent = Math.min((spent / budget.limit) * 100, 100);
                  
                  let statusColor = 'bg-emerald-500';
                  if (percent > 75) statusColor = 'bg-orange-500';
                  if (percent > 90) statusColor = 'bg-red-500';

                  return (
                    <div key={budget.categoryId} className="bg-theme-surface p-5 rounded-2xl border border-white/5 shadow-lg relative group">
                      <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color.replace('text', 'bg').split('-')[0] + '-500/20'} border border-white/5`}>
                                {cat.icon}
                              </div>
                              <div className="flex-1">
                                  <h3 className="font-bold text-base text-theme-primary">{cat.name}</h3>
                                  {!isManaging && (
                                      percent > 90 ? (
                                          <p className="text-red-400 text-xs flex items-center gap-1">⚠️ {Math.round(percent)}% {t('limitReached')}</p>
                                      ) : (
                                          <p className="text-emerald-400 text-xs">{t('onTrack')}</p>
                                      )
                                  )}
                              </div>
                          </div>
                          
                          {isManaging ? (
                              <button onClick={() => handleDeleteBudget(budget.categoryId)} className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                                  <Trash2 size={18} />
                              </button>
                          ) : (
                              <div className="text-right">
                                  <p className="text-lg font-bold text-theme-primary">${spent.toFixed(0)}</p>
                                  <p className="text-xs text-theme-secondary">of ${budget.limit}</p>
                              </div>
                          )}
                      </div>
                      
                      {!isManaging ? (
                          <div className="h-2.5 w-full bg-[#1e1e1e] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${statusColor} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-500`} style={{ width: `${percent}%` }} />
                          </div>
                      ) : (
                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                              <span className="text-xs text-theme-secondary uppercase">{t('limit')}:</span>
                              <span className="text-theme-secondary font-bold">$</span>
                              <input 
                                  type="number" 
                                  value={budget.limit} 
                                  onChange={(e) => handleUpdateLimit(budget.categoryId, e.target.value)}
                                  className="bg-transparent font-bold text-white w-full outline-none border-b border-white/10 focus:border-indigo-500"
                              />
                          </div>
                      )}
                    </div>
                  );
                })}
                
                {isManaging && budgets.length === 0 && (
                     <div className="text-center p-8 border-2 border-dashed border-white/10 rounded-3xl text-theme-secondary">
                         No envelopes. Click + to add one.
                     </div>
                )}
              </div>
          </div>
      )}

      {/* Add Budget Modal */}
      {showAddBudgetModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
             <div className="bg-theme-surface w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-theme-primary">Add Envelope</h3>
                    <button onClick={() => setShowAddBudgetModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-4">
                     <button onClick={() => { setShowAddBudgetModal(false); setShowCustomEnvelopeModal(true); }} className="w-full p-4 bg-theme-brand text-white rounded-xl font-bold mb-4 flex items-center justify-center gap-2">
                         <Plus size={20} /> Create Custom Envelope
                     </button>
                     <p className="text-xs text-theme-secondary uppercase font-bold mb-3">Or choose from categories:</p>
                     
                     <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
                        {availableCategories.length === 0 ? (
                            <p className="text-center text-theme-secondary py-4">All categories used!</p>
                        ) : (
                            availableCategories.map(cat => (
                                <button 
                                    key={cat.id} 
                                    onClick={() => { handleAddBudget(cat.id); setShowAddBudgetModal(false); }}
                                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left border border-white/5"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color} bg-opacity-20`}>
                                        {cat.icon}
                                    </div>
                                    <span className="font-bold text-theme-primary">{cat.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* Custom Envelope Modal */}
      {showCustomEnvelopeModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-theme-surface w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 flex flex-col gap-4">
                   <h3 className="font-bold text-lg text-theme-primary">New Custom Envelope</h3>
                   
                   <div>
                       <label className="text-xs text-zinc-500 mb-1 block">Name</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. My Project" />
                   </div>
                   
                   <div>
                       <label className="text-xs text-zinc-500 mb-1 block">Monthly Limit</label>
                       <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" value={customLimit} onChange={e => setCustomLimit(e.target.value)} placeholder="0" />
                   </div>

                   <div>
                       <label className="text-xs text-zinc-500 mb-1 block">Icon</label>
                       <div className="flex gap-2 text-xl overflow-x-auto pb-2 no-scrollbar">
                           {['✉️','📦','🎀','🧸','🛠️','💊','📚','🎵'].map(i => (
                               <button key={i} onClick={() => setCustomIcon(i)} className={`p-2 rounded-lg ${customIcon === i ? 'bg-theme-brand' : 'bg-white/5'}`}>{i}</button>
                           ))}
                       </div>
                   </div>

                   <div className="flex gap-3 mt-2">
                       <button onClick={() => setShowCustomEnvelopeModal(false)} className="px-4 py-3 rounded-xl bg-white/5 text-theme-secondary font-bold">Cancel</button>
                       <button onClick={handleAddCustomBudget} className="flex-1 py-3 rounded-xl bg-theme-brand text-white font-bold">Create Envelope</button>
                   </div>
              </div>
          </div>
      )}


      {/* --- GOALS VIEW --- */}
      {activeTab === 'GOALS' && (
          <div className="animate-in fade-in duration-300">
             <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-bold text-theme-primary">Shared Goals</h2>
                <button onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-indigo-900/40">
                    <Plus size={14} /> {t('addGoal')}
                </button>
              </div>

              <div className="flex flex-col gap-4 pb-20">
                  {goals.map(goal => {
                      const percent = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                      return (
                          <div key={goal.id} onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                              className={`relative overflow-hidden p-6 rounded-3xl border border-white/5 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform`}>
                              <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-20`} />
                              
                              <div className="relative z-10">
                                  <div className="flex justify-between items-start mb-8">
                                      <div>
                                          <h3 className="text-xl font-bold text-white mb-1">{goal.name}</h3>
                                          <p className="text-xs text-zinc-400">{t('deadline')}: {new Date(goal.deadline).toLocaleDateString()}</p>
                                      </div>
                                      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-xl shadow-inner border border-white/10">
                                          {goal.icon}
                                      </div>
                                  </div>

                                  <div className="flex justify-between items-end mb-2">
                                      <span className="text-2xl font-bold">${goal.savedAmount.toLocaleString()}</span>
                                      <span className="text-xs font-mono text-zinc-400 mb-1">{percent.toFixed(0)}%</span>
                                  </div>

                                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                      <div className="h-full bg-white/90 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${percent}%` }} />
                                  </div>
                                  
                                  {percent >= 100 && (
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-xl border border-emerald-500/50 px-4 py-2 rounded-xl flex items-center gap-2 animate-in zoom-in">
                                          <Trophy size={16} className="text-yellow-400" />
                                          <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">{t('goalReached')}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- GOAL MODAL --- */}
      {showGoalModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
              <div className="bg-theme-surface w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                      <h3 className="font-bold text-theme-primary">{editingGoal ? t('editGoal') : t('addGoal')}</h3>
                      <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-white/10 rounded-full text-theme-secondary"><X size={20} /></button>
                  </div>
                  <GoalForm initialData={editingGoal} onSave={handleSaveGoal} onDelete={handleDeleteGoal} t={t} />
              </div>
          </div>
      )}

    </div>
  );
};

// --- Sub-component for Goal Form ---
const GoalForm = ({ initialData, onSave, onDelete, t }: { initialData: Goal | null, onSave: (g: Goal) => void, onDelete: (id: string) => void, t: any }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [target, setTarget] = useState(initialData?.targetAmount.toString() || '');
    const [saved, setSaved] = useState(initialData?.savedAmount.toString() || '');
    const [date, setDate] = useState(initialData?.deadline || '');
    const [icon, setIcon] = useState(initialData?.icon || '🎯');

    const icons = ['🎯', '✈️', '🏠', '🚗', '🎓', '💍', '💻', '🆘'];

    const handleSubmit = () => {
        if (!name || !target) return;
        onSave({
            id: initialData?.id || Math.random().toString(),
            name,
            targetAmount: parseFloat(target),
            savedAmount: parseFloat(saved) || 0,
            deadline: date || new Date().toISOString().split('T')[0],
            icon,
            color: initialData?.color || 'from-indigo-600 to-purple-600' // Default color
        });
    };

    return (
        <div className="p-6 flex flex-col gap-4">
            <div>
                <label className="text-xs text-zinc-500 mb-1 block">{t('name')}</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Laptop" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-zinc-500 mb-1 block">{t('targetAmount')}</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" value={target} onChange={e => setTarget(e.target.value)} placeholder="1000" />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-1 block">{t('savedAmount')}</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" value={saved} onChange={e => setSaved(e.target.value)} placeholder="0" />
                </div>
            </div>
            <div>
                <label className="text-xs text-zinc-500 mb-1 block">{t('deadline')}</label>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
                <label className="text-xs text-zinc-500 mb-1 block">Icon</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {icons.map(i => (
                        <button key={i} onClick={() => setIcon(i)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${icon === i ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}>{i}</button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                {initialData && (
                    <button onClick={() => onDelete(initialData.id)} className="p-4 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500/20"><Trash2 size={20} /></button>
                )}
                <button onClick={handleSubmit} className="flex-1 p-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500">{t('save')}</button>
            </div>
        </div>
    );
};