import React, { useState, useMemo } from 'react';
import { ChevronLeft, Plus, Trash2, CheckCircle2, Circle, ShoppingCart, Tag, DollarSign, X, ArrowUpRight, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingItem, Language, Currency } from '../types';
import { getTranslation } from '../i18n';
import { formatAmount } from '../utils/formatUtils';
import { CATEGORIES } from '../constants';

interface ShoppingListViewProps {
    onBack: () => void;
    lang: Language;
    items: ShoppingItem[];
    onUpdateItems: (items: ShoppingItem[]) => void;
    exchangeRate: number;
    displayCurrency: Currency;
    euroRate?: number;
    onConvertToExpense: (item: ShoppingItem) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
    onBack,
    lang,
    items,
    onUpdateItems,
    exchangeRate,
    displayCurrency,
    euroRate,
    onConvertToExpense
}) => {
    const t = (key: any) => getTranslation(lang, key);
    const [newItemName, setNewItemName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItemQty, setNewItemQty] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES[1].id); // Default to Food
    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const addItem = () => {
        if (!newItemName.trim()) return;
        const newItem: ShoppingItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: newItemName,
            quantity: newItemQty || '1',
            completed: false,
            price: newItemPrice ? parseFloat(newItemPrice) : undefined,
            currency: displayCurrency,
            categoryId: selectedCategoryId
        };
        onUpdateItems([newItem, ...items]);
        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
        setSelectedCategoryId(CATEGORIES[1].id);
        setShowAddForm(false);
    };

    const toggleItem = (id: string) => {
        onUpdateItems(items.map(item => 
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const deleteItem = (id: string) => {
        onUpdateItems(items.filter(item => item.id !== id));
    };

    const clearCompleted = () => {
        onUpdateItems(items.filter(item => !item.completed));
    };

    const totalPrice = useMemo(() => {
        return items.reduce((acc, item) => {
            if (item.price) {
                let priceUSD = item.price;
                if (item.currency === Currency.VES) priceUSD = item.price / exchangeRate;
                else if (item.currency === Currency.EUR) priceUSD = (item.price * (euroRate || exchangeRate)) / exchangeRate;
                
                return acc + priceUSD;
            }
            return acc;
        }, 0);
    }, [items, exchangeRate, euroRate]);

    const filteredCategories = CATEGORIES.filter(c => 
        t(c.name as any).toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.id.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const selectedCategory = CATEGORIES.find(c => c.id === selectedCategoryId) || CATEGORIES[1];

    return (
        <div className="flex flex-col h-full bg-theme-bg overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-6 pt-12 pb-6 flex items-center justify-between bg-theme-surface/50 backdrop-blur-md border-b border-theme-soft shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 rounded-xl bg-theme-soft text-theme-secondary hover:text-theme-primary transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-theme-primary tracking-tight">{t('shoppingList')}</h1>
                        <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest">{items.length} {t('items') || 'Items'}</p>
                    </div>
                </div>
                <button 
                    onClick={clearCompleted}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title={t('clearCompleted')}
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 pb-32">
                <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-theme-soft flex items-center justify-center text-theme-secondary mb-4">
                                <ShoppingCart size={40} />
                            </div>
                            <p className="text-theme-secondary font-medium">{t('noShoppingItems')}</p>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {items.map((item) => {
                                const cat = CATEGORIES.find(c => c.id === item.categoryId) || CATEGORIES[1];
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`p-4 rounded-[1.5rem] border transition-all flex flex-col gap-3 group ${
                                            item.completed 
                                            ? 'bg-theme-soft/30 border-transparent opacity-60' 
                                            : 'bg-theme-surface border-theme-soft shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => toggleItem(item.id)}
                                                className={`shrink-0 transition-colors ${item.completed ? 'text-emerald-500' : 'text-theme-secondary hover:text-theme-brand'}`}
                                            >
                                                {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                            </button>
                                            
                                            <div className="flex-1 min-w-0" onClick={() => toggleItem(item.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1.5 rounded-lg text-[10px] ${cat.color} bg-opacity-10`}>
                                                        {cat.icon}
                                                    </span>
                                                    <h3 className={`font-bold text-sm truncate ${item.completed ? 'line-through text-theme-secondary' : 'text-theme-primary'}`}>
                                                        {item.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 ml-8">
                                                    <span className="text-[9px] font-black uppercase text-theme-secondary bg-theme-soft px-1.5 py-0.5 rounded">
                                                        {item.quantity}
                                                    </span>
                                                    {item.price && (
                                                        <span className="text-[10px] font-bold text-emerald-500">
                                                            {formatAmount(item.price, exchangeRate, item.currency || Currency.USD, true, 2, euroRate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => deleteItem(item.id)}
                                                className="p-2 rounded-lg text-theme-secondary hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex items-center justify-end gap-2 border-t border-theme-soft pt-2 transition-opacity">
                                            <button
                                                onClick={() => onConvertToExpense(item)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-theme-brand/10 text-theme-brand text-[10px] font-black uppercase tracking-wider hover:bg-theme-brand hover:text-white transition-all"
                                            >
                                                <ArrowUpRight size={14} />
                                                {t('convertToTransaction')}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Total Section */}
            {totalPrice > 0 && (
                <div className="absolute bottom-24 left-6 right-6 p-4 rounded-2xl bg-theme-surface/80 backdrop-blur-xl border border-theme-soft shadow-xl flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-theme-secondary">{t('totalPrice')}</span>
                    <span className="text-lg font-black text-theme-primary">
                        {formatAmount(totalPrice, exchangeRate, displayCurrency, true, 2, euroRate)}
                    </span>
                </div>
            )}

            {/* Add FAB */}
            <div className="absolute bottom-8 right-6">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddForm(true)}
                    className="w-14 h-14 rounded-full bg-theme-brand text-white shadow-lg shadow-theme-brand/30 flex items-center justify-center hover:brightness-110 transition-all"
                >
                    <Plus size={28} />
                </motion.button>
            </div>

            {/* Add Modal/Form */}
            <AnimatePresence>
                {showAddForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-theme-surface border border-theme-soft rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-theme-primary">{t('addShoppingItem')}</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-theme-secondary"><X size={20} /></button>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary px-1">{t('name')}</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        placeholder={t('shoppingItemPlaceholder')}
                                        className="w-full bg-theme-soft border border-theme-soft rounded-2xl px-4 py-3 text-sm focus:border-theme-brand outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary px-1">{t('category')}</label>
                                    <button 
                                        onClick={() => setShowCategorySelector(!showCategorySelector)}
                                        className="w-full bg-theme-soft border border-theme-soft rounded-2xl px-4 py-3 flex items-center justify-between group hover:border-theme-brand/50 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedCategory.color} bg-opacity-20`}>
                                                {selectedCategory.icon}
                                            </span>
                                            <span className="text-sm font-bold text-theme-primary">{t(selectedCategory.name as any) || selectedCategory.name}</span>
                                        </div>
                                        <ChevronDown size={18} className={`text-theme-secondary transition-transform ${showCategorySelector ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {showCategorySelector && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-theme-soft/50 rounded-2xl border border-theme-soft mt-2"
                                            >
                                                <div className="p-2 sticky top-0 bg-theme-soft border-b border-theme-soft z-10">
                                                    <div className="relative">
                                                        <input 
                                                            type="text"
                                                            value={categorySearch}
                                                            onChange={(e) => setCategorySearch(e.target.value)}
                                                            placeholder={t('searchCategories') || 'Search...'}
                                                            className="w-full bg-theme-bg border border-theme-soft rounded-xl pl-8 pr-4 py-2 text-xs outline-none"
                                                        />
                                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-secondary" />
                                                    </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-2 gap-2 no-scrollbar">
                                                    {filteredCategories.map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => {
                                                                setSelectedCategoryId(cat.id);
                                                                setShowCategorySelector(false);
                                                            }}
                                                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${selectedCategoryId === cat.id ? 'bg-theme-brand/10 border-theme-brand/30' : 'bg-theme-bg border-transparent hover:border-theme-soft'}`}
                                                        >
                                                            <span className={`p-1.5 rounded-lg text-[10px] ${cat.color} bg-opacity-10`}>
                                                                {cat.icon}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-theme-primary truncate">{t(cat.name as any)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary px-1">{t('quantity') || 'Qty'}</label>
                                        <input 
                                            type="text" 
                                            value={newItemQty}
                                            onChange={(e) => setNewItemQty(e.target.value)}
                                            placeholder="1, 2"
                                            className="w-full bg-theme-soft border border-theme-soft rounded-2xl px-4 py-3 text-sm focus:border-theme-brand outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary px-1">{t('amount')}</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={newItemPrice}
                                                onChange={(e) => setNewItemPrice(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-theme-soft border border-theme-soft rounded-2xl pl-8 pr-4 py-3 text-sm focus:border-theme-brand outline-none transition-all"
                                            />
                                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary" />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={addItem}
                                    disabled={!newItemName.trim()}
                                    className="w-full mt-4 py-4 rounded-2xl bg-theme-brand text-white font-black hover:brightness-110 active:scale-95 disabled:grayscale disabled:opacity-50 shadow-lg shadow-theme-brand/30 transition-all"
                                >
                                    {t('addShoppingItem')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
