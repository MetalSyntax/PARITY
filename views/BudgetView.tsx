import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, X, Trash2, Trophy, ChevronDown, Coins, DollarSign, Search, Filter, Calendar, ArrowDownLeft, History, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../constants';
import { Transaction, TransactionType, Language, Budget, Goal, ConfirmConfig, Currency } from '../types';
import { getTranslation } from '../i18n';
import { PinModal } from '../components/PinModal';
import { TransactionItem } from '../components/TransactionItem';
import { formatAmount as fmtAmt, formatSecondaryAmount as fmtSec } from '../utils/formatUtils';
import { renderAccountIcon as renderAccIcon } from '../utils/iconUtils';
import { Eye, EyeOff } from 'lucide-react';
import { 
    FaPlane, FaHouse, FaCar, FaGraduationCap, FaGift, FaGamepad, FaBasketShopping, FaEnvelope, 
    FaBox, FaRibbon, FaBriefcaseMedical, FaBullseye, FaRing, FaLaptop, FaPiggyBank, FaSackDollar, 
    FaVault, FaCreditCard, FaHandHoldingDollar, FaUmbrella, FaHeart, FaStar, FaUtensils, FaMugHot, 
    FaMusic, FaBicycle, FaDumbbell, FaPaw, FaBaby, FaChurch, FaPerson, FaMobileScreen, FaWifi, 
    FaCamera, FaFilm, FaMedal, FaCouch, FaWrench, FaTree, FaSun, FaPizzaSlice, FaWineGlass, FaBook 
} from 'react-icons/fa6';

// Icon Maps
const SHARED_ICONS: Record<string, React.ElementType> = {
    'envelope': FaEnvelope,
    'box': FaBox,
    'ribbon': FaRibbon,
    'shopping': FaBasketShopping,
    'game': FaGamepad,
    'medical': FaBriefcaseMedical,
    'piggy': FaPiggyBank,
    'sack': FaSackDollar,
    'vault': FaVault,
    'card': FaCreditCard,
    'hand': FaHandHoldingDollar,
    'target': FaBullseye,
    'travel': FaPlane,
    'house': FaHouse,
    'car': FaCar,
    'education': FaGraduationCap,
    'ring': FaRing,
    'laptop': FaLaptop,
    'gift': FaGift,
    'umbrella': FaUmbrella,
    'heart': FaHeart,
    'star': FaStar,
    'food': FaUtensils,
    'coffee': FaMugHot,
    'music': FaMusic,
    'bike': FaBicycle,
    'gym': FaDumbbell,
    'paw': FaPaw,
    'baby': FaBaby,
    'church': FaChurch,
    'user': FaPerson,
    'mobile': FaMobileScreen,
    'wifi': FaWifi,
    'camera': FaCamera,
    'film': FaFilm,
    'medal': FaMedal,
    'couch': FaCouch,
    'tools': FaWrench,
    'tree': FaTree,
    'sun': FaSun,
    'pizza': FaPizzaSlice,
    'beer': FaWineGlass,
    'book': FaBook
};

const ENVELOPE_ICONS = SHARED_ICONS;
const GOAL_ICONS = SHARED_ICONS;

const renderIcon = (key: string, map: Record<string, React.ElementType>, size: number = 20) => {
    const IconComp = map[key] || SHARED_ICONS[key] || map['target'] || FaEnvelope;
    // Check if key is actually an emoji (fallback)
    if (!map[key] && (key.length < 5 || key.match(/\p{Emoji}/u))) {
         return <span style={{ fontSize: size }}>{key}</span>;
    }
    return <IconComp size={size} />;
};

interface BudgetViewProps {
  onBack: () => void;
  transactions: Transaction[];
  lang: Language;
  budgets: Budget[];
  goals: Goal[];
  accounts: any[]; // Using any to avoid importing Account if not needed, but Account is available
  onUpdateBudgets: (budgets: Budget[]) => void;
  onUpdateGoals: (goals: Goal[]) => void;
  onUpdateAccounts: (accounts: any[]) => void;
  onToggleBottomNav: (show: boolean) => void;
  showConfirm: (config: ConfirmConfig) => void;
  exchangeRate: number;
  euroRate?: number;
  isBalanceVisible: boolean;
  onSaveTransaction: (data: any) => void;
  displayCurrency: Currency;
  onToggleDisplayCurrency: () => void;
  initialTab?: 'ENVELOPES' | 'GOALS';
}

export const BudgetView: React.FC<BudgetViewProps> = ({ 
    onBack, 
    transactions, 
    lang, 
    budgets, 
    goals, 
    accounts,
    onUpdateBudgets,
    onUpdateGoals,
    onUpdateAccounts,
    onToggleBottomNav,
    showConfirm,
    exchangeRate,
    euroRate,
    displayCurrency,
    onToggleDisplayCurrency,
    isBalanceVisible,
    onSaveTransaction,
    initialTab = 'ENVELOPES'
}) => {
  const t = (key: any) => getTranslation(lang, key);

  const [isBalanceVisibleLocal, setIsBalanceVisibleLocal] = useState(isBalanceVisible);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedBudgetTransactions, setSelectedBudgetTransactions] = useState<{catId: string, name: string} | null>(null);

  const formatAmount = (usd: number, decimals: number = 2) => 
    fmtAmt(usd, exchangeRate, displayCurrency, isBalanceVisibleLocal, decimals, euroRate);

  const formatSecondary = (usd: number) => 
    fmtSec(usd, exchangeRate, displayCurrency, isBalanceVisibleLocal, 2, euroRate);
  const [activeTab, setActiveTab] = useState<'ENVELOPES' | 'GOALS'>(initialTab);
  const [isManaging, setIsManaging] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // Modal/Form State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showCustomEnvelopeModal, setShowCustomEnvelopeModal] = useState(false); 
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToComplete, setGoalToComplete] = useState<Goal | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState(new Date().toISOString().slice(0, 7));

  const handleDeleteMonth = (m: string) => {
    showConfirm({
        message: `${t('delete')}: ${m}`,
        onConfirm: () => {
            onUpdateBudgets(budgets.filter(b => b.month !== m));
            if (selectedMonth === m) setSelectedMonth(new Date().toISOString().slice(0, 7));
        }
    });
  };

  const handleDuplicatePreviousMonth = () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(year, month - 2); // month - 2 to go one back
      const prevMonthStr = prevDate.toISOString().slice(0, 7);
      
      const prevBudgets = budgets.filter(b => b.month === prevMonthStr);
      if (prevBudgets.length === 0) {
           showConfirm({ message: t('noBudgetsInPreviousMonth'), onConfirm: () => {} });
          return;
      }

      setDuplicateLoading(true);
      const duplicated = prevBudgets.map(b => ({
          ...b,
          id: Math.random().toString(36).substr(2, 9),
          month: selectedMonth
      }));
      
      onUpdateBudgets([...budgets, ...duplicated]);
      setDuplicateLoading(false);
  };

  React.useEffect(() => {
    onToggleBottomNav(!(showGoalModal || showAddBudgetModal || showCustomEnvelopeModal));
  }, [showGoalModal, showAddBudgetModal, showCustomEnvelopeModal, onToggleBottomNav]);

  // New Custom Envelope Form State
  const [customName, setCustomName] = useState('');
  const [customLimit, setCustomLimit] = useState('');
  const [customIcon, setCustomIcon] = useState('envelope');
  const [parentCategory, setParentCategory] = useState<string>('');

  // Logic...
  const handleUpdateLimit = (catId: string, newLimit: string) => {
      const limit = parseFloat(newLimit);
      if (isNaN(limit)) return;
      
      const specific = budgets.find(b => b.categoryId === catId && b.month === selectedMonth);
      if (specific) {
          // Update the specific one (even if it was a hider with limit -1)
          onUpdateBudgets(budgets.map(b => (b === specific) ? { ...b, limit } : b));
      } else {
          // If no specific for this month, create one to override the global fallback
          const global = budgets.find(b => b.categoryId === catId && !b.month);
          if (global) {
              onUpdateBudgets([...budgets, { ...global, limit, month: selectedMonth }]);
          } else {
              onUpdateBudgets([...budgets, { categoryId: catId, limit, month: selectedMonth }]);
          }
      }
  };

  const handleAddBudget = (catId: string) => {
      if (budgets.find(b => b.categoryId === catId && b.month === selectedMonth)) return;
      onUpdateBudgets([...budgets, { categoryId: catId, limit: 100, month: selectedMonth }]);
  };

  const handleAddCustomBudget = () => {
      if (!customName || !customLimit) return;
      const targetParent = CATEGORIES.find(c => c.id === parentCategory);
      const newBudget: Budget = {
          categoryId: `custom_${Date.now()}`,
          limit: parseFloat(customLimit),
          customName: customName,
          customIcon: customIcon,
          customColor: targetParent ? targetParent.color.split(' ')[1] : 'text-indigo-400',
          parentCategoryId: parentCategory || undefined,
          month: selectedMonth
      };
      onUpdateBudgets([...budgets, newBudget]);
      setShowCustomEnvelopeModal(false);
      // Reset form
      setCustomName('');
      setCustomLimit('');
      setCustomIcon('envelope');
      setParentCategory('');
  };

  const handleDeleteBudget = (catId: string) => {
      showConfirm({
          message: t('deleteEnvelopeConfirm'),
          onConfirm: () => {
              const specific = budgets.find(b => b.categoryId === catId && b.month === selectedMonth);
              if (specific) {
                  // If it was already a specific override, delete it
                  onUpdateBudgets(budgets.filter(b => b !== specific));
              } else {
                  // If it was a global fallback, create a "hider" for this month
                  onUpdateBudgets([...budgets, { categoryId: catId, limit: -1, month: selectedMonth }]);
              }
          }
      });
  };
  
  // ... Goal handlers
  const handleSaveGoal = (goal: Goal) => {
      if (editingGoal) {
          onUpdateGoals(goals.map(g => g.id === goal.id ? goal : g));
      } else {
          onUpdateGoals([...goals, goal]);
      }
      setShowGoalModal(false);
      setEditingGoal(null);
  };
  const handleDeleteGoal = (id: string) => {
      showConfirm({
          message: t('deleteGoalConfirm'),
          onConfirm: () => {
              onUpdateGoals(goals.filter(g => g.id !== id));
              setShowGoalModal(false);
              setEditingGoal(null);
          }
      });
  };

  const handleCompleteGoal = (goal: Goal, type: TransactionType) => {
      const contributionsMap = new Map<string, number>();
      
      // Sum up contributions per account
      (goal.contributions || []).forEach(c => {
          const current = contributionsMap.get(c.accountId) || 0;
          contributionsMap.set(c.accountId, current + c.amount);
      });

      // If no contributions but savedAmount was entered manually, use first account as fallback or don't record
      if (contributionsMap.size === 0 && goal.savedAmount > 0) {
          if (accounts.length > 0) {
              contributionsMap.set(accounts[0].id, goal.savedAmount);
          }
      }

      // Record transactions
      contributionsMap.forEach((amount, accountId) => {
          const acc = accounts.find(a => a.id === accountId);
          onSaveTransaction({
              amount: amount,
              originalCurrency: acc?.currency || Currency.USD,
              exchangeRate,
              euroRate,
              type,
              category: 'savings',
              accountId,
              note: `🎯 ${t('goalReached')}: ${goal.name}`,
              date: new Date().toISOString(),
              skipBalanceUpdate: true
          });
      });

      // Mark as completed and update
      onUpdateGoals(goals.map(g => g.id === goal.id ? { ...g, completed: true } : g));
      setGoalToComplete(null);
  };

  const filteredBudgets = useMemo(() => {
    // 1. Get specific overrides for this month
    const specific = budgets.filter(b => b.month === selectedMonth);
    const specificCatIds = new Set(specific.map(b => b.categoryId));
    
    // 2. Get global budgets (templates) that don't have a specific override OR a hider
    const global = budgets.filter(b => !b.month && !specificCatIds.has(b.categoryId));
    
    // 3. Combine them and filter out hiders (limit: -1)
    return [...specific, ...global].filter(b => b.limit >= 0);
  }, [budgets, selectedMonth]);
  const availableCategories = CATEGORIES.filter(c => !filteredBudgets.find(b => b.categoryId === c.id));

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300 w-full max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto">
      {/* Top utility bar */}
      <div className="flex items-center justify-end mb-4 gap-2">
            <button 
                onClick={onToggleDisplayCurrency}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/5 transition-all font-black text-[10px] ${displayCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
            >
                <div className="w-4 h-4 flex items-center justify-center">
                    {displayCurrency === Currency.VES ? (
                        <span className="text-[9px] font-black leading-none">Bs</span>
                    ) : displayCurrency === Currency.EUR ? (
                        <Euro size={14} />
                    ) : (
                        <DollarSign size={14} />
                    )}
                </div>
                <span className="hidden sm:inline">{displayCurrency}</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="bg-theme-surface border border-white/5 text-xs font-bold text-theme-secondary rounded-2xl px-4 py-2 outline-none focus:border-theme-soft/50 transition-all cursor-pointer hover:text-theme-primary flex items-center gap-2 min-w-[100px] justify-between relative"
              >
                <span>{selectedMonth}</span>
                <ChevronDown size={14} className={`text-theme-secondary transition-transform duration-200 ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>

              {showMonthPicker && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowMonthPicker(false)} />
                  <div className="absolute top-full mt-2 right-0 w-40 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[240px] overflow-y-auto no-scrollbar py-2">
                       {(() => {
                           const months = new Set<string>();
                           const currentMonth = new Date().toISOString().slice(0, 7);
                           
                           transactions.forEach(t => months.add(t.date.slice(0, 7)));
                           budgets.forEach(b => {
                               if (b.month) months.add(b.month);
                           });
                           
                           if (months.size === 0) months.add(currentMonth);

                           const sortedMonths = Array.from(months).sort().reverse();

                           return (
                             <>
                               {sortedMonths.map(m => (
                                 <div key={m} className={`w-full flex items-center justify-between px-4 py-2 text-xs font-bold transition-colors group hover:bg-white/5 ${selectedMonth === m ? 'text-theme-brand bg-white/5' : 'text-theme-secondary hover:text-theme-primary'}`}>
                                   <button
                                     onClick={() => {
                                       setSelectedMonth(m);
                                       setShowMonthPicker(false);
                                     }}
                                     className="flex-1 text-left py-1"
                                   >
                                     {m}
                                   </button>
                                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMonth(m);
                                          }}
                                          className="p-1 hover:text-red-400"
                                       >
                                          <Trash2 size={12} />
                                       </button>
                                   </div>
                                 </div>
                               ))}
                               <div className="border-t border-white/5 mt-2 pt-2">
                                  <button 
                                    onClick={() => {
                                        setShowMonthPicker(false);
                                        setShowAddMonthModal(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-black text-theme-brand hover:bg-theme-brand/10 transition-colors"
                                  >
                                    <Plus size={14} />
                                    {t('addMonth')}
                                  </button>
                               </div>
                             </>
                           );
                       })()}
                    </div>
                  </div>
                </>
              )}
            </div>
      </div>

      {/* Main Header */}
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
               <h1 className="text-xl font-bold text-theme-primary">{t('budgetsAndGoals')}</h1>
               <p className="text-xs text-theme-secondary font-medium">{t('manageBudgetsDesc')}</p>
           </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-theme-surface rounded-2xl mb-8 flex-shrink-0">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveTab('ENVELOPES'); setIsManaging(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'ENVELOPES' ? 'bg-theme-bg text-theme-primary shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
              <History size={16} className={activeTab === 'ENVELOPES' ? 'text-theme-brand' : ''} />
              {t('envelopes')}
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveTab('GOALS'); setIsManaging(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'GOALS' ? 'bg-theme-bg text-theme-primary shadow-lg' : 'text-theme-secondary hover:text-theme-primary'}`}
          >
              <Trophy size={16} className={activeTab === 'GOALS' ? 'text-theme-brand' : ''} />
              {t('goals')}
          </motion.button>
      </div>

      {/* --- ENVELOPES VIEW --- */}
      {activeTab === 'ENVELOPES' && (
          <div className="animate-in fade-in duration-300">
              <div className="mb-6 flex justify-end items-center">
                <div className="flex gap-2">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsManaging(!isManaging)}
                        className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${isManaging ? 'bg-theme-brand text-white' : 'text-theme-brand hover:bg-white/5'}`}
                    >
                        {isManaging ? t('done') : t('manage')}
                    </motion.button>
                    {isManaging && (
                         <motion.button 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ rotate: 90 }}
                            onClick={() => setShowAddBudgetModal(true)} 
                            className="bg-theme-brand text-white p-1 rounded-full"
                         >
                            <Plus size={16} />
                         </motion.button>
                    )}
                </div>
              </div>

              {/* Budget vs Income Summary */}
              {(() => {
                  const totalBudgetSum = filteredBudgets.reduce((acc, b) => acc + b.limit, 0);
                  const totalIncomeMonth = transactions
                    .filter(t => t.type === TransactionType.INCOME && (t.budgetMonth || t.date).startsWith(selectedMonth))
                    .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
                  
                  const percentOfIncome = totalIncomeMonth > 0 ? (totalBudgetSum / totalIncomeMonth) * 100 : 0;
                  const remainingToBudget = totalIncomeMonth - totalBudgetSum;

                  return (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-theme-surface border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <DollarSign size={120} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <div className="text-[10px] text-theme-secondary uppercase font-black tracking-widest mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-theme-brand" />
                                        {t('totalEnvelopes')}
                                    </div>
                                    <button 
                                        onClick={() => isBalanceVisibleLocal ? setIsBalanceVisibleLocal(false) : setShowPinModal(true)}
                                        className="p-1 hover:bg-white/5 rounded-md text-theme-secondary transition-colors"
                                    >
                                        {isBalanceVisibleLocal ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-theme-primary">{formatAmount(totalBudgetSum)}</span>
                                    <span className="text-xs text-theme-secondary font-mono">{formatSecondary(totalBudgetSum)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-theme-secondary uppercase font-black tracking-widest mb-2 flex items-center gap-2 justify-end">
                                    {t('totalMonthlyIncome')}
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-emerald-400">{formatAmount(totalIncomeMonth)}</span>
                                    <span className="text-xs text-theme-secondary font-mono">{formatSecondary(totalIncomeMonth)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(percentOfIncome, 100)}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className={`h-full rounded-full shadow-[0_0_20px_rgba(0,0,0,0.3)] ${
                                    percentOfIncome > 100 ? 'bg-red-500' : 
                                    percentOfIncome > 85 ? 'bg-orange-500' : 'bg-theme-brand'
                                }`}
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                    percentOfIncome > 100 ? 'bg-red-500/20 text-red-500' : 'bg-theme-brand/20 text-theme-brand'
                                }`}>
                                    {percentOfIncome.toFixed(0)}%
                                </span>
                                <p className="text-[11px] font-bold text-theme-secondary">
                                    {t('ofIncomeGoesHere')}
                                </p>
                            </div>
                            {remainingToBudget > 0 ? (
                                <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                    <Plus size={12} /> {formatAmount(remainingToBudget)} {t('remaining')}
                                </p>
                            ) : remainingToBudget < 0 && (
                                <p className="text-[11px] font-bold text-red-400">
                                    {t('overspending')} {formatAmount(Math.abs(remainingToBudget))}
                                </p>
                            )}
                        </div>
                    </motion.div>
                  );
              })()}

              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
                {filteredBudgets.map(budget => {
                  let cat = CATEGORIES.find(c => c.id === budget.categoryId);
                  
                  // Handle Custom Budgets which don't have a real category
                  if (!cat && budget.customName) {
                      cat = {
                          id: budget.categoryId,
                          name: budget.customName,
                          icon: budget.customIcon || 'box',
                          color: budget.customColor || 'text-indigo-400'
                      } as any;
                  }

                  if (!cat) return null;

                  const targetCatId = budget.parentCategoryId || cat?.id;
                  const spent = transactions
                    .filter(t => t.category === targetCatId && t.type === TransactionType.EXPENSE && (t.budgetMonth || t.date).startsWith(selectedMonth))
                    .reduce((acc, t) => acc + t.normalizedAmountUSD, 0);
                  
                  const percent = Math.min((spent / budget.limit) * 100, 100);
                  
                  let statusColor = 'bg-emerald-500';
                  if (percent > 75) statusColor = 'bg-orange-500';
                  if (percent > 90) statusColor = 'bg-red-500';

                  return (
                    <motion.div 
                      layout
                      key={budget.categoryId} 
                      onClick={() => !isManaging && setSelectedBudgetTransactions({ catId: targetCatId, name: t(cat.name) })}
                      className={`bg-theme-surface p-5 rounded-2xl border border-white/5 shadow-lg relative group overflow-hidden ${!isManaging ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                              <motion.div 
                                whileHover={{ rotate: [0, -10, 10, 0] }}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.color.replace('text', 'bg').split('-')[0] + '-500/20'} border border-white/5`}
                              >
                                {typeof cat.icon === 'string' ? renderIcon(cat.icon, ENVELOPE_ICONS, 24) : cat.icon}
                              </motion.div>
                              <div className="flex-1">
                                  <h3 className="font-bold text-base text-theme-primary">{t(cat.name)}</h3>
                                  {budget.parentCategoryId && (
                                       <p className="text-[10px] text-theme-secondary opacity-70 flex items-center gap-1 font-bold italic">
                                            {t(CATEGORIES.find(c => c.id === budget.parentCategoryId)?.name || '')}
                                       </p>
                                  )}
                                  <AnimatePresence mode="wait">
                                  {!isManaging && (
                                      percent > 90 ? (
                                          <motion.p 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            key="warning"
                                            className="text-red-400 text-xs flex items-center gap-1"
                                          >
                                            ⚠️ {Math.round(percent)}% {t('limitReached')}
                                          </motion.p>
                                      ) : (
                                          <motion.p 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            key="ok"
                                            className="text-emerald-400 text-xs"
                                          >
                                            {t('onTrack')}
                                          </motion.p>
                                      )
                                  )}
                                  </AnimatePresence>
                              </div>
                          </div>
                          
                          {isManaging ? (
                              <motion.button 
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteBudget(budget.categoryId)} 
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg"
                              >
                                  <Trash2 size={18} />
                              </motion.button>
                          ) : (
                               <div className="text-right">
                                  <p className="text-lg font-bold text-theme-primary">{formatAmount(spent)}</p>
                                  <p className="text-[10px] text-zinc-500">{formatSecondary(spent)}</p>
                                  <p className="text-xs text-theme-secondary">{t('of')} {formatAmount(budget.limit)}</p>
                              </div>
                          )}
                      </div>
                      
                      {!isManaging ? (
                          <>
                             <div className="h-2.5 w-full bg-[#1e1e1e] rounded-full overflow-hidden">
                               <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${percent}%` }}
                                   transition={{ duration: 1, ease: "easeOut" }}
                                   className={`h-full rounded-full ${statusColor} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} 
                               />
                             </div>
                             
                             {/* Associated Goals Progress */}
                             <div className="mt-4 flex flex-col gap-2">
                                {goals.filter(g => g.categoryId === budget.categoryId && !g.completed).map(g => (
                                    <div key={g.id} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-[9px] uppercase tracking-tighter font-black text-theme-secondary">
                                            <div className="flex items-center gap-1">
                                                <Trophy size={10} className="text-yellow-400" />
                                                <span className="truncate">{g.name}</span>
                                            </div>
                                            <span className="shrink-0">{Math.min((g.savedAmount / g.targetAmount) * 100, 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                               className="h-full bg-yellow-400/50 rounded-full" 
                                               style={{ width: `${(g.savedAmount / g.targetAmount) * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                             </div>
                          </>
                      ) : (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2"
                          >
                              <span className="text-theme-secondary font-bold">
                                  {displayCurrency === Currency.VES ? 'Bs' : displayCurrency === Currency.EUR ? '€' : '$'}
                              </span>
                              <input 
                                  type="number" 
                                  value={displayCurrency === Currency.VES ? budget.limit * exchangeRate : displayCurrency === Currency.EUR ? budget.limit * (exchangeRate / (euroRate || exchangeRate)) : budget.limit} 
                                  onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (isNaN(val)) return;
                                      const usdVal = displayCurrency === Currency.VES ? val / exchangeRate : displayCurrency === Currency.EUR ? val * ((euroRate || exchangeRate) / exchangeRate) : val;
                                      handleUpdateLimit(budget.categoryId, usdVal.toString());
                                  }}
                                  className="bg-transparent font-bold text-white w-full outline-none border-b border-white/10 focus:border-theme-brand"
                              />
                          </motion.div>
                      )}
                    </motion.div>
                  );
                })}
                {filteredBudgets.length === 0 && (
                     <div className="text-center p-12 border-2 border-dashed border-white/10 rounded-2xl bg-theme-surface/30 flex flex-col items-center gap-6">
                         <div className="w-20 h-20 rounded-full bg-theme-surface border border-white/5 flex items-center justify-center text-4xl shadow-2xl">
                             🎨
                         </div>
                         <div>
                             <p className="text-theme-primary font-black text-lg mb-1">{t('noEnvelopes')}</p>
                             <p className="text-theme-secondary text-xs">{t('createFirstEnvelopeToStart')}</p>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-3">
                             <button 
                                onClick={() => { 
                                    setIsManaging(true); 
                                    setShowAddBudgetModal(true); 
                                }}
                                className="bg-theme-brand text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-theme-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                             >
                                <Plus size={18} />
                                {t('addBudget')}
                             </button>
                             <button 
                                onClick={handleDuplicatePreviousMonth}
                                disabled={duplicateLoading}
                                className="bg-theme-surface border border-white/5 text-theme-primary px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/5 transition-all flex items-center gap-2"
                             >
                                <History size={18} />
                                {t('duplicatePrevious')}
                             </button>
                             {budgets.some(b => !b.month) && (
                                <button 
                                    onClick={() => {
                                        const base = budgets.filter(b => !b.month);
                                        const imported = base.map(b => ({
                                            ...b,
                                            id: Math.random().toString(36).substr(2, 9),
                                            month: selectedMonth
                                        }));
                                        onUpdateBudgets([...budgets, ...imported]);
                                    }}
                                    className="bg-theme-surface border border-theme-soft text-theme-brand px-8 py-4 rounded-2xl font-black text-sm hover:bg-theme-brand/5 transition-all flex items-center gap-2"
                                >
                                    <FaEnvelope size={18} />
                                    {t('useBaseBudget')}
                                </button>
                             )}
                         </div>
                     </div>
                )}
              </motion.div>
          </div>
      )}

       {/* Add Budget Modal */}
       <AnimatePresence>
       {showAddBudgetModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
             <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-theme-surface w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
             >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-theme-primary">{t('addEnvelopeTitle')}</h3>
                    <button onClick={() => setShowAddBudgetModal(false)} className="p-2 hover:bg-white/10 rounded-full text-theme-secondary transition-colors"><X size={20} /></button>
                </div>
                <div className="p-4 overflow-y-auto no-scrollbar">
                     <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setShowAddBudgetModal(false); setShowCustomEnvelopeModal(true); }} 
                        className="w-full p-4 bg-theme-brand text-white rounded-xl font-bold mb-4 flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                     >
                         <Plus size={20} /> {t('createCustomEnvelope')}
                     </motion.button>
                     <p className="text-xs text-theme-secondary uppercase font-bold mb-3 tracking-widest">{t('chooseCategory')}</p>
                      
                      <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                        <input
                           type="text"
                           placeholder={t('searchCategories')}
                           value={categorySearch}
                           onChange={(e) => setCategorySearch(e.target.value)}
                           className="w-full bg-theme-surface border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm outline-none focus:border-theme-soft/50 transition-all font-bold text-white placeholder:text-zinc-600"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        {availableCategories
                          .filter(cat => t(cat.name).toLowerCase().includes(categorySearch.toLowerCase()))
                          .map(cat => (
                                <motion.button 
                                    whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                    key={cat.id} 
                                    onClick={() => { handleAddBudget(cat.id); setShowAddBudgetModal(false); setCategorySearch(''); }}
                                    className="flex items-center gap-3 p-3 rounded-xl transition-colors text-left border border-white/5"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color} bg-opacity-20`}>
                                        {cat.icon}
                                    </div>
                                    <span className="font-bold text-theme-primary">{t(cat.name)}</span>
                                </motion.button>
                            ))
                        }
                    </div>
                </div>
             </motion.div>
          </motion.div>
       )}
      </AnimatePresence>

      <AnimatePresence>
       {showAddMonthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-theme-surface w-full max-w-sm rounded-[32px] border border-white/10 p-8 shadow-2xl relative"
             >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl text-theme-primary">{t('addMonth')}</h3>
                    <button onClick={() => setShowAddMonthModal(false)} className="text-theme-secondary hover:text-theme-primary">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-theme-secondary uppercase tracking-widest block mb-2">{t('selectDate')}</label>
                        <input 
                            type="month" 
                            value={newMonthInput}
                            onChange={(e) => setNewMonthInput(e.target.value)}
                            className="w-full bg-theme-bg border border-white/5 rounded-2xl px-4 py-4 text-theme-primary font-bold focus:border-theme-brand outline-none transition-all"
                        />
                    </div>

                    <button 
                        onClick={() => {
                            setSelectedMonth(newMonthInput);
                            setShowAddMonthModal(false);
                            // Ensure it's showing the manager view for the new month
                            setIsManaging(true);
                        }}
                        className="w-full py-4 bg-theme-brand text-white rounded-2xl font-black shadow-lg shadow-brand/20 active:scale-95 transition-all"
                    >
                        {t('addMonth')}
                    </button>
                </div>
             </motion.div>
          </motion.div>
       )}
      </AnimatePresence>

      {/* Custom Envelope Modal */}
      <AnimatePresence>
      {showCustomEnvelopeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-theme-surface w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 flex flex-col gap-4"
              >
                   <div className="flex justify-between items-center mb-2">
                       <h3 className="font-bold text-lg text-theme-primary">{t('newCustomEnvelope')}</h3>
                       <button onClick={() => setShowCustomEnvelopeModal(false)} className="p-2 hover:bg-white/10 rounded-full text-theme-secondary transition-colors"><X size={20} /></button>
                   </div>
                   
                   <div>
                       <label className="text-xs text-zinc-500 mb-1 block">{t('name')}</label>
                       <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-theme-brand transition-all" value={customName} onChange={e => setCustomName(e.target.value)} placeholder={t('projectNamePlaceholder')} />
                   </div>
                   
                   <div>
                       <label className="text-xs text-zinc-500 mb-1 block">{t('monthlyLimit')}</label>
                       <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-theme-brand transition-all" value={customLimit} onChange={e => setCustomLimit(e.target.value)} placeholder="0" />
                   </div>

                   <div>
                       <label className="text-xs text-zinc-500 mb-1 block">{t('parentCategory')}</label>
                       <select 
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none appearance-none"
                           value={parentCategory}
                           onChange={e => setParentCategory(e.target.value)}
                       >
                           <option value="" className="bg-theme-surface">{t('none')}</option>
                           {CATEGORIES.map(cat => (
                               <option key={cat.id} value={cat.id} className="bg-theme-surface">
                                   {t(cat.name)}
                               </option>
                           ))}
                       </select>
                   </div>

                   <div>
                       <label className="text-xs text-zinc-500 mb-1 block">{t('icon')}</label>
                       <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                           {Object.keys(ENVELOPE_ICONS).map(key => (
                               <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                key={key} 
                                onClick={() => setCustomIcon(key)} 
                                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${customIcon === key ? 'bg-theme-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-theme-secondary hover:bg-white/10 hover:text-theme-primary'}`}
                               >
                                {renderIcon(key, ENVELOPE_ICONS, 20)}
                               </motion.button>
                           ))}
                       </div>
                   </div>

                   <div className="flex gap-3 mt-4">
                       <button onClick={() => setShowCustomEnvelopeModal(false)} className="px-4 py-3 rounded-xl bg-white/5 text-theme-secondary font-bold flex-1">{t('cancel')}</button>
                       <button onClick={handleAddCustomBudget} className="flex-[2] py-3 rounded-xl bg-theme-brand text-white font-bold shadow-lg shadow-brand/20">{t('createEnvelopeAction')}</button>
                   </div>
              </motion.div>
          </motion.div>
      )}
      </AnimatePresence>


      {/* --- GOALS VIEW --- */}
      {activeTab === 'GOALS' && (
          <div className="animate-in fade-in duration-300">
             <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-bold text-theme-primary">{t('sharedGoals')}</h2>
                <button onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-indigo-900/40">
                    <Plus size={14} /> {t('addGoal')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-32">
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
                                          <p className="text-xs text-zinc-400">{t('deadline')}: {new Date(goal.deadline)?.toLocaleDateString()}</p>
                                      </div>
                                      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-xl shadow-inner border border-white/10 text-white">
                                          {renderIcon(goal.icon, GOAL_ICONS, 20)}
                                      </div>
                                  </div>

                                  <div className="flex justify-between items-end mb-2">
                                      <div>
                                          <span className="text-2xl font-bold block">{formatAmount(goal.savedAmount)}</span>
                                          <span className="text-xs text-zinc-400 font-mono">{formatSecondary(goal.savedAmount)}</span>
                                      </div>
                                      <span className="text-xs font-mono text-zinc-400 mb-1">{percent.toFixed(0)}%</span>
                                  </div>

                                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                      <div className="h-full bg-white/90 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${percent}%` }} />
                                  </div>
                                  
                                  {percent >= 100 && !goal.completed && (
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-xl border border-emerald-500/50 px-4 py-2 rounded-xl flex flex-col items-center gap-2 animate-in zoom-in group/complete">
                                          <div className="flex items-center gap-2">
                                              <Trophy size={16} className="text-yellow-400" />
                                              <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">{t('goalReached')}</span>
                                          </div>
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); setGoalToComplete(goal); }}
                                              className="mt-2 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full hover:scale-105 transition-transform"
                                          >
                                              {t('completeGoal')}
                                          </button>
                                      </div>
                                  )}
                                  {goal.completed && (
                                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-xl border border-zinc-500/50 px-4 py-2 rounded-xl flex items-center gap-2 opacity-60">
                                            <Trophy size={16} className="text-zinc-400" />
                                            <span className="text-zinc-400 font-bold text-sm whitespace-nowrap">{t('done')}</span>
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
      <AnimatePresence>
      {showGoalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-theme-surface w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
              >
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                      <h3 className="font-bold text-theme-primary">{editingGoal ? t('editGoal') : t('addGoal')}</h3>
                      <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-white/10 rounded-full text-theme-secondary transition-colors"><X size={20} /></button>
                  </div>
                  <GoalForm 
                    initialData={editingGoal} 
                    onSave={handleSaveGoal} 
                    onDelete={handleDeleteGoal} 
                    accounts={accounts}
                    onUpdateAccounts={onUpdateAccounts}
                    t={t} 
                    showConfirm={showConfirm}
                    displayCurrency={displayCurrency}
                    exchangeRate={exchangeRate}
                    euroRate={euroRate}
                    onSaveTransaction={onSaveTransaction}
                  />
              </motion.div>
          </motion.div>
      )}
      </AnimatePresence>

      {/* Goal Completion Choice Modal */}
      <AnimatePresence>
      {goalToComplete && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4"
           >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-theme-surface w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col gap-6"
                >
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-2">
                            <Trophy size={32} />
                        </div>
                        <h3 className="font-black text-xl text-theme-primary">{t('completeGoal')}</h3>
                        <p className="text-sm text-theme-secondary">{t('expenseOrIncome')}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => handleCompleteGoal(goalToComplete, TransactionType.EXPENSE)}
                            className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowDownLeft size={18} />
                            {t('registerAsExpense')}
                        </button>
                        <button 
                            onClick={() => handleCompleteGoal(goalToComplete, TransactionType.INCOME)}
                            className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            {t('registerAsIncome')}
                        </button>
                    </div>

                    <button 
                        onClick={() => setGoalToComplete(null)}
                        className="text-theme-secondary text-sm font-bold hover:text-theme-primary transition-colors text-center"
                    >
                        {t('cancel')}
                    </button>
                </motion.div>
           </motion.div>
      )}
      </AnimatePresence>

      {showPinModal && (
        <PinModal 
          lang={lang}
          biometricsEnabled={true}
          onSuccess={() => {
            setIsBalanceVisibleLocal(true);
            setShowPinModal(false);
          }}
          onCancel={() => setShowPinModal(false)}
        />
      )}

      {/* Envelope Detail Modal */}
      <AnimatePresence>
        {selectedBudgetTransactions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-theme-surface w-full max-w-lg rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex flex-col">
                  <h3 className="font-black text-xl text-theme-primary">{selectedBudgetTransactions.name}</h3>
                  <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest">{selectedMonth}</p>
                </div>
                <button 
                  onClick={() => setSelectedBudgetTransactions(null)} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-theme-secondary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  {(() => {
                    const txs = transactions.filter(t => 
                      t.category === selectedBudgetTransactions.catId && 
                      t.type === TransactionType.EXPENSE && 
                      (t.budgetMonth || t.date).startsWith(selectedMonth)
                    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    if (txs.length === 0) return (
                      <div className="text-center py-12 text-theme-secondary opacity-50">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold">{t('noTransactions')}</p>
                      </div>
                    );

                    return txs.map(tx => (
                      <TransactionItem 
                        key={tx.id}
                        transaction={tx}
                        accounts={accounts}
                        lang={lang}
                        isBalanceVisible={isBalanceVisibleLocal}
                        displayCurrency={displayCurrency}
                        compact={true}
                        onSelect={() => {}} 
                        onEdit={() => {}} 
                        onDelete={() => {}} 
                      />
                    ));
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// --- Sub-component for Goal Form ---
const GoalForm = ({ 
    initialData, 
    onSave, 
    onDelete, 
    t, 
    accounts, 
    onUpdateAccounts, 
    showConfirm, 
    displayCurrency, 
    exchangeRate,
    euroRate,
    onSaveTransaction
}: { 
    initialData: Goal | null, 
    onSave: (g: Goal) => void, 
    onDelete: (id: string) => void, 
    t: any,
    accounts: any[],
    onUpdateAccounts: (accs: any[]) => void,
    showConfirm: (config: ConfirmConfig) => void,
    displayCurrency: Currency;
    exchangeRate: number;
    euroRate?: number;
    onSaveTransaction: (data: any) => void;
}) => {
    const [name, setName] = useState(initialData?.name || '');
    const [target, setTarget] = useState(initialData?.targetAmount.toString() || '');
    const [saved, setSaved] = useState(initialData?.savedAmount.toString() || '');
    const [date, setDate] = useState(initialData?.deadline || '');
    const [icon, setIcon] = useState(initialData?.icon || 'target');
    const [contributions, setContributions] = useState<any[]>(initialData?.contributions || []);
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.categoryId || '');

    // Contribution form state
    const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
    const [contributionAmount, setContributionAmount] = useState('');
    const [showContribute, setShowContribute] = useState(false);

    const handleSubmit = () => {
        if (!name || !target) return;
        onSave({
            id: initialData?.id || Math.random().toString(),
            name,
            targetAmount: parseFloat(target),
            savedAmount: parseFloat(saved) || 0,
            deadline: date || new Date().toISOString().split('T')[0],
            icon,
            color: initialData?.color || 'from-indigo-600 to-purple-600',
            contributions: contributions
        });
    };

    const handleAddContribution = () => {
        const amountValue = parseFloat(contributionAmount);
        if (isNaN(amountValue) || amountValue <= 0 || !selectedAccount) return;

        const account = accounts.find(a => a.id === selectedAccount);
        if (!account) return;

        // Normalize amount to USD for the goal's savedAmount
        const normalizedAmount = account.currency === Currency.USD || account.currency === Currency.USDT ? amountValue : (account.currency === Currency.EUR ? (amountValue * (euroRate || 0)) / exchangeRate : amountValue / exchangeRate);
        
        // Record as a TRANSACTION in history
        onSaveTransaction({
            amount: amountValue,
            originalCurrency: account.currency,
            exchangeRate: exchangeRate,
            euroRate: euroRate,
            type: TransactionType.EXPENSE,
            category: 'savings',
            accountId: selectedAccount,
            note: `${t('goalContribution')}: ${name}`,
            date: new Date().toISOString()
        });

        const newSavedAmount = parseFloat(saved || '0') + normalizedAmount;
        const newContribution = {
            id: Math.random().toString(36).substr(2, 9),
            accountId: selectedAccount,
            amount: amountValue,
            originalCurrency: account.currency,
            exchangeRate: exchangeRate,
            normalizedAmountUSD: normalizedAmount,
            date: new Date().toISOString()
        };

        const newContributions = [...contributions, newContribution];
        setContributions(newContributions);
        setSaved(newSavedAmount.toString());
        
        // Check if goal reached
        const isReached = newSavedAmount >= parseFloat(target);
        
        onSave({
            id: initialData?.id || Math.random().toString(),
            name,
            targetAmount: parseFloat(target),
            savedAmount: newSavedAmount,
            deadline: date || new Date().toISOString().split('T')[0],
            icon,
            color: initialData?.color || 'from-indigo-600 to-purple-600',
            contributions: newContributions,
            categoryId: selectedCategoryId
        });

        // Reset
        setContributionAmount('');
        setShowContribute(false);
    };

    const handleReturnContribution = (contribution: any) => {
        showConfirm({
            message: t('returnFundsConfirm'),
            onConfirm: () => {
                const updatedAccounts = accounts.map(a => 
                    a.id === contribution.accountId ? { ...a, balance: a.balance + contribution.amount } : a
                );

                const newContributions = contributions.filter(c => c.id !== contribution.id);
                setContributions(newContributions);
                setSaved((parseFloat(saved || '0') - contribution.normalizedAmountUSD).toString());

                onUpdateAccounts(updatedAccounts);
                onSave({
                    id: initialData?.id || '',
                    name,
                    targetAmount: parseFloat(target),
                    savedAmount: parseFloat(saved || '0') - contribution.normalizedAmountUSD,
                    deadline: date || new Date().toISOString().split('T')[0],
                    icon,
                    color: initialData?.color || 'from-indigo-600 to-purple-600',
                    contributions: newContributions
                });
            }
        });
    };

    const formatShortAmount = (usd: number) => {
        let val = usd;
        if (displayCurrency === Currency.VES) {
            val = usd * exchangeRate;
        } else if (displayCurrency === Currency.EUR && euroRate) {
            val = usd * (exchangeRate / euroRate);
        }
        const symbol = displayCurrency === Currency.VES ? 'Bs' : displayCurrency === Currency.EUR ? '€' : '$';
        return `${symbol}${val.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
    };

    return (
        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-zinc-500 mb-1 block">{t('name')}</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder={t('goalNamePlaceholder')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">{t('targetAmount')}</label>
                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" value={target} onChange={e => setTarget(e.target.value)} placeholder="1000" />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">{t('savedAmount')}</label>
                        <input type="number" readOnly={contributions.length > 0} className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 ${contributions.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} value={saved} onChange={e => setSaved(e.target.value)} placeholder="0" />
                        {contributions.length > 0 && <p className="text-[10px] text-indigo-400 mt-1">{t('savedFromContributions')}</p>}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-zinc-500 mb-1 block">{t('deadline')}</label>
                    <div className="relative">
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-indigo-500" value={date} onChange={e => setDate(e.target.value)} />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                            <Calendar size={18} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-zinc-500 mb-1 block">{t('associateEnvelope')}</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 appearance-none"
                            value={selectedCategoryId}
                            onChange={e => setSelectedCategoryId(e.target.value)}
                        >
                            <option value="" className="bg-theme-surface">{t('none')}</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id} className="bg-theme-surface">
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>
                
                {/* Contributions Section */}
                {initialData && (
                    <div className="mt-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-black uppercase text-theme-secondary flex items-center gap-2">
                                <History size={14} /> {t('contributions')}
                            </h4>
                            <button 
                                onClick={() => setShowContribute(!showContribute)}
                                className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-colors"
                            >
                                {showContribute ? t('cancel') : `+ ${t('addFunds')}`}
                            </button>
                        </div>

                        {showContribute && (
                            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-indigo-500/20 space-y-3 animate-in slide-in-from-top-2">
                                <select 
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    value={selectedAccount}
                                    onChange={e => setSelectedAccount(e.target.value)}
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="bg-theme-surface">
                                            {acc.name} ({acc.currency} {acc.balance.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                                        value={contributionAmount}
                                        onChange={e => setContributionAmount(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleAddContribution}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20"
                                    >
                                        {t('add')}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar">
                            {contributions.length === 0 ? (
                                <p className="text-[10px] text-zinc-500 italic text-center py-2">{t('noContributions')}</p>
                            ) : (
                                contributions.slice().reverse().map(c => {
                                    const acc = accounts.find(a => a.id === c.accountId);
                                    return (
                                        <div key={c.id} className="flex justify-between items-center p-2 bg-black/20 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                                    {acc?.iconKey ? renderAccIcon(acc.iconKey) : (acc?.currency || c.originalCurrency)}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white">{acc?.name || 'Wallet'}</p>
                                                    <p className="text-[8px] text-zinc-500">{new Date(c.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-theme-primary">{c.amount} {c.originalCurrency}</p>
                                                    <p className="text-[8px] text-zinc-500 font-mono">≈ {formatShortAmount(c.normalizedAmountUSD)}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleReturnContribution(c)}
                                                    className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                                                    title={t('returnFunds')}
                                                >
                                                    <ArrowDownLeft size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs text-zinc-500 mb-1 block">{t('icon')}</label>
                    <div className="grid grid-cols-5 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.keys(GOAL_ICONS).map(key => (
                            <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                key={key} 
                                onClick={() => setIcon(key)} 
                                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${icon === key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                            >
                                {renderIcon(key, GOAL_ICONS, 20)}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                {initialData && (
                    <button onClick={() => onDelete(initialData.id)} className="p-4 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500/20"><Trash2 size={20} /></button>
                )}
                <button onClick={handleSubmit} className="flex-1 p-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/40">{t('save')}</button>
            </div>
        </div>
    );
};
