import React, { useState, useMemo } from 'react';
import { ChevronLeft, Plus, Trash2, CheckCircle2, Circle, ShoppingCart, Pencil, DollarSign, X, ArrowUpRight, ChevronDown, Search, List, PlusSquare, PackagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingItem, Language, Currency, ShoppingList, ConfirmConfig } from '../types';
import { getTranslation } from '../i18n';
import { formatAmount, formatSecondaryAmount } from '../utils/formatUtils';
import { CATEGORIES } from '../constants';

interface ShoppingListViewProps {
    onBack: () => void;
    lang: Language;
    lists: ShoppingList[];
    activeListId: string | null;
    onUpdateLists: (lists: ShoppingList[]) => void;
    onSetActiveListId: (id: string | null) => void;
    exchangeRate: number;
    displayCurrency: Currency;
    euroRate?: number;
    onConvertToExpense: (item: any) => void;
    onShowConfirm: (config: ConfirmConfig) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
    onBack,
    lang,
    lists,
    activeListId,
    onUpdateLists,
    onSetActiveListId,
    exchangeRate,
    displayCurrency,
    euroRate,
    onConvertToExpense,
    onShowConfirm
}) => {
    const t = (key: any) => getTranslation(lang, key);
    
    const currentList = useMemo(() => {
        return lists.find(l => l.id === activeListId) || lists[0] || null;
    }, [lists, activeListId]);

    const items = currentList?.items || [];
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAddListForm, setShowAddListForm] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [localCurrency, setLocalCurrency] = useState<Currency>(displayCurrency);
    
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES[1].id); 
    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [listToEdit, setListToEdit] = useState<ShoppingList | null>(null);

    const onUpdateItems = (newItems: ShoppingItem[]) => {
        if (!currentList) return;
        onUpdateLists(lists.map(l => 
            l.id === currentList.id ? { ...l, items: newItems } : l
        ));
    };

    const addItem = () => {
        if (!newItemName.trim()) return;
        
        if (editingItem) {
            onUpdateItems(items.map(item => 
                item.id === editingItem.id ? { 
                    ...item, 
                    name: newItemName, 
                    quantity: newItemQty || '1',
                    price: newItemPrice ? parseFloat(newItemPrice) : undefined,
                    categoryId: selectedCategoryId
                } : item
            ));
            setEditingItem(null);
        } else {
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
        }

        setNewItemName('');
        setNewItemQty('');
        setNewItemPrice('');
        setSelectedCategoryId(CATEGORIES[1].id);
        setShowAddForm(false);
    };

    const editItem = (item: ShoppingItem) => {
        setEditingItem(item);
        setNewItemName(item.name);
        setNewItemQty(item.quantity);
        setNewItemPrice(item.price?.toString() || '');
        setSelectedCategoryId(item.categoryId || CATEGORIES[1].id);
        setShowAddForm(true);
    };

    const toggleItem = (id: string) => {
        onUpdateItems(items.map(item => 
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const deleteItem = (id: string) => {
        onUpdateItems(items.filter(item => item.id !== id));
    };

    const addList = () => {
        if (!newListName.trim()) return;
        
        if (listToEdit) {
            onUpdateLists(lists.map(l => 
                l.id === listToEdit.id ? { ...l, name: newListName } : l
            ));
            setListToEdit(null);
        } else {
            const newList: ShoppingList = {
                id: 'list_' + Date.now(),
                name: newListName,
                items: [],
                createdAt: new Date().toISOString()
            };
            onUpdateLists([...lists, newList]);
            onSetActiveListId(newList.id);
        }
        setNewListName('');
        setShowAddListForm(false);
    };

    const deleteList = (id: string) => {
        const newLists = lists.filter(l => l.id !== id);
        onUpdateLists(newLists);
        if (activeListId === id) {
            onSetActiveListId(newLists.length > 0 ? newLists[0].id : null);
        }
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
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack} 
                        className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </motion.button>
                    <div>
                        <h1 className="text-xl font-bold text-theme-primary">{currentList?.name || t('shoppingList')}</h1>
                        <p className="text-xs text-theme-secondary font-medium">{items.length} {t('product') || 'productos'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setLocalCurrency(prev => prev === Currency.USD ? Currency.VES : prev === Currency.VES ? Currency.EUR : Currency.USD)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/5 transition-all font-black text-[10px] ${localCurrency !== Currency.USD ? 'bg-theme-brand text-white shadow-lg' : 'bg-theme-surface text-theme-secondary hover:text-theme-primary'}`}
                    >
                        <div className="w-4 h-4 flex items-center justify-center">
                            {localCurrency === Currency.VES ? (
                                <span className="text-[9px] font-black leading-none">Bs</span>
                            ) : localCurrency === Currency.EUR ? (
                                <span className="text-[12px] font-black leading-none">€</span>
                            ) : (
                                <DollarSign size={14} />
                            )}
                        </div>
                        <span className="hidden sm:inline">{localCurrency}</span>
                    </button>
                    <button 
                        onClick={() => lists.length > 0 && setShowAddForm(true)}
                        className={`p-3 rounded-2xl shadow-lg transition-all ${lists.length > 0 ? 'bg-theme-brand text-white shadow-theme-brand/20 hover:scale-105 active:scale-95' : 'bg-theme-soft text-theme-secondary opacity-50 cursor-not-allowed'}`}
                        title={t('addShoppingItem')}
                        disabled={lists.length === 0}
                    >
                        <PackagePlus size={20} />
                    </button>
                </div>
            </div>

            {/* List Selector */}
            <div className="px-6 mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                <button 
                    onClick={() => setShowAddListForm(true)}
                    className="flex-shrink-0 p-2.5 rounded-2xl border border-dashed border-theme-soft text-theme-secondary hover:text-theme-brand hover:border-theme-brand transition-all"
                >
                    <Plus size={18} />
                </button>
                {lists.map(list => {
                    const isActive = activeListId === list.id || (!activeListId && lists[0]?.id === list.id);
                    return (
                        <div key={list.id} className="flex-shrink-0 flex items-center gap-1">
                            <button
                                onClick={() => onSetActiveListId(list.id)}
                                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap border flex items-center gap-2 ${
                                    isActive 
                                    ? 'bg-theme-brand text-white border-theme-brand shadow-lg shadow-theme-brand/20' 
                                    : 'bg-theme-surface border-theme-soft text-theme-secondary hover:border-theme-brand/30'
                                }`}
                            >
                                {list.name}
                                <span className={`opacity-50 font-bold ${isActive ? 'text-white' : ''}`}>{list.items.length}</span>
                            </button>
                            {isActive && (
                                <button 
                                    onClick={() => {
                                        setListToEdit(list);
                                        setNewListName(list.name);
                                        setShowAddListForm(true);
                                    }}
                                    className="p-2 rounded-lg bg-theme-soft text-theme-secondary hover:text-theme-brand transition-all"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 pb-32">
                <AnimatePresence mode="popLayout">
                    {lists.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-theme-surface/30 p-8 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center mt-10"
                        >
                            <div className="w-20 h-20 rounded-full bg-theme-surface flex items-center justify-center text-theme-secondary mb-6 shadow-xl border border-white/5 animate-bounce">
                                <PlusSquare size={32} />
                            </div>
                            <h3 className="text-xl font-black text-theme-primary mb-2">{t('noLists') || 'No hay listas'}</h3>
                            <p className="text-theme-secondary text-sm max-w-[240px] leading-relaxed mb-6">{t('createFirstListPrompt') || 'Crea tu primera lista de compras para agregar productos.'}</p>
                            <button 
                                onClick={() => setShowAddListForm(true)} 
                                className="px-8 py-4 bg-theme-brand text-white font-black rounded-2xl shadow-xl shadow-theme-brand/20 hover:scale-105 active:scale-95 transition-all text-sm"
                            >
                                {t('createList') || 'Crear Lista'}
                            </button>
                        </motion.div>
                    ) : items.length === 0 ? (
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
                                        className={`p-4 rounded-2xl border transition-all group relative cursor-pointer ${
                                            item.completed 
                                            ? 'bg-theme-soft/30 border-transparent opacity-60' 
                                            : 'bg-theme-surface border-theme-soft shadow-sm'
                                        }`}
                                        onClick={() => setActiveRowId(activeRowId === item.id ? null : item.id)}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <button 
                                                    onClick={() => toggleItem(item.id)}
                                                    className={`shrink-0 transition-colors ${item.completed ? 'text-emerald-500' : 'text-theme-secondary hover:text-theme-brand'}`}
                                                >
                                                    {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                                </button>
                                                <div className="flex flex-col min-w-0" onClick={() => toggleItem(item.id)}>
                                                    <div className="flex items-start gap-2 pt-0.5">
                                                        <span className={`p-1 rounded-md text-[8px] ${cat.color} bg-opacity-10 shrink-0 mt-0.5`}>
                                                            {cat.icon}
                                                        </span>
                                                        <h3 className={`font-bold text-sm whitespace-normal break-words leading-tight ${item.completed ? 'line-through text-theme-secondary' : 'text-theme-primary'}`}>
                                                            {item.name}
                                                        </h3>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-theme-secondary bg-theme-soft px-1.5 py-0.5 rounded-2xl uppercase leading-none flex items-center gap-0.5">
                                                        <span className="opacity-50 text-[8px]">x</span>
                                                        {item.quantity}
                                                    </span>
                                                    {item.price && (
                                                        <div className="flex flex-col items-end mt-1 leading-none">
                                                            <span className="text-[10px] font-bold text-emerald-500">
                                                                {(() => {
                                                                    let usdVal = item.price;
                                                                    if (item.currency === Currency.VES) usdVal = item.price / exchangeRate;
                                                                    else if (item.currency === Currency.EUR) usdVal = (item.price * (euroRate || exchangeRate)) / exchangeRate;
                                                                    return formatAmount(usdVal, exchangeRate, localCurrency, true, 2, euroRate);
                                                                })()}
                                                            </span>
                                                            <span className="text-[8px] text-theme-secondary opacity-60 font-mono mt-0.5">
                                                                {(() => {
                                                                    let usdVal = item.price;
                                                                    if (item.currency === Currency.VES) usdVal = item.price / exchangeRate;
                                                                    else if (item.currency === Currency.EUR) usdVal = (item.price * (euroRate || exchangeRate)) / exchangeRate;
                                                                    return formatSecondaryAmount(usdVal, exchangeRate, localCurrency, true, 2, euroRate);
                                                                })()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${
                                                    activeRowId === item.id 
                                                    ? 'opacity-100 translate-x-0' 
                                                    : 'opacity-0 translate-x-4 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:translate-x-0 sm:group-hover:pointer-events-auto'
                                                }`}>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); editItem(item); }}
                                                        className="p-1.5 rounded-lg text-theme-secondary hover:text-theme-brand hover:bg-theme-brand/10 transition-all"
                                                        title={t('editShoppingItem')}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            onShowConfirm({
                                                                message: t('deleteItemConfirm') || '¿Eliminar este producto?',
                                                                onConfirm: () => deleteItem(item.id)
                                                            });
                                                        }}
                                                        className="p-1.5 rounded-lg text-theme-secondary hover:text-red-400 hover:bg-red-400/10 transition-all"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
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
                <div className="absolute bottom-4 left-6 right-6 p-4 rounded-2xl bg-theme-surface/80 backdrop-blur-xl border border-theme-soft shadow-xl flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-theme-secondary">{t('totalPrice')}</span>
                        <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-theme-primary">
                                {formatAmount(totalPrice, exchangeRate, localCurrency, true, 2, euroRate)}
                            </span>
                            <span className="text-[10px] text-theme-secondary opacity-70 font-mono">
                                {formatSecondaryAmount(totalPrice, exchangeRate, localCurrency, true, 2, euroRate)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            let finalPrice = totalPrice;
                            if (localCurrency === Currency.VES) finalPrice = totalPrice * exchangeRate;
                            else if (localCurrency === Currency.EUR && euroRate) finalPrice = totalPrice * (exchangeRate / euroRate);

                            // Create a consolidated expense
                            onConvertToExpense({
                                id: 'total_' + Date.now(),
                                name: currentList?.name || t('shoppingList'),
                                quantity: items.length.toString(),
                                completed: true,
                                price: parseFloat(finalPrice.toFixed(2)),
                                currency: localCurrency,
                                categoryId: CATEGORIES[1].id // Shopping/General
                            });
                        }}
                        className="w-full py-3 rounded-xl bg-theme-brand text-white text-[10px] font-black uppercase tracking-wider hover:brightness-110 shadow-lg shadow-theme-brand/20 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowUpRight size={14} />
                        {t('convertToTransactionAll')}
                    </button>
                </div>
            )}

            {/* Add/Edit List Modal */}
            <AnimatePresence>
                {showAddListForm && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-theme-surface border border-theme-soft rounded-2xl p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-theme-primary">{listToEdit ? (t('editList') || 'Editar Lista') : (t('newList') || 'Nueva Lista')}</h3>
                                <button onClick={() => { setShowAddListForm(false); setListToEdit(null); setNewListName(''); }} className="text-theme-secondary"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary px-1">{t('listName') || 'Nombre de la Lista'}</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder={t('listNamePlaceholder') || "Supermercado, Farmacia..."}
                                        className="w-full bg-theme-soft border border-theme-soft rounded-2xl px-4 py-3 text-sm focus:border-theme-brand outline-none transition-all"
                                    />
                                </div>
                                
                                <div className="flex gap-2">
                                    {listToEdit && (
                                        <button 
                                            onClick={() => {
                                                onShowConfirm({
                                                    message: t('deleteListConfirm') || 'Delete this list?',
                                                    onConfirm: () => {
                                                        deleteList(listToEdit.id);
                                                        setShowAddListForm(false);
                                                        setListToEdit(null);
                                                        setNewListName('');
                                                    }
                                                });
                                            }}
                                            className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-500 font-black hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={18} className="mx-auto" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={addList}
                                        disabled={!newListName.trim()}
                                        className={`${listToEdit ? 'flex-[2]' : 'w-full'} py-4 rounded-2xl bg-theme-brand text-white font-black hover:brightness-110 active:scale-95 disabled:grayscale disabled:opacity-50 shadow-lg shadow-theme-brand/30 transition-all`}
                                    >
                                        {listToEdit ? (t('save') || 'Guardar') : (t('createList') || 'Crear Lista')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Modal/Form */}
            <AnimatePresence>
                {showAddForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-theme-surface border border-theme-soft rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-lg font-black text-theme-primary">{editingItem ? t('editShoppingItem') : t('addShoppingItem')}</h3>
                                 <button onClick={() => { setShowAddForm(false); setEditingItem(null); }} className="text-theme-secondary"><X size={20} /></button>
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
                                        className="w-full p-4 bg-theme-brand text-white rounded-2xl font-bold mb-4 flex items-center justify-center gap-2 shadow-lg shadow-brand/20 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-2xl flex items-center justify-center ${selectedCategory.color} bg-opacity-20`}>
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

                                 <div className="flex gap-2 mt-4">
                                     {editingItem && (
                                         <button 
                                             onClick={() => {
                                                 onShowConfirm({
                                                     message: t('deleteItemConfirm') || '¿Eliminar este producto?',
                                                     onConfirm: () => {
                                                         deleteItem(editingItem.id);
                                                         setShowAddForm(false);
                                                         setEditingItem(null);
                                                     }
                                                 });
                                             }}
                                             className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-500 font-black hover:bg-red-500/20 transition-all"
                                         >
                                             {t('delete') || 'Eliminar'}
                                         </button>
                                     )}
                                     <button 
                                         onClick={addItem}
                                         disabled={!newItemName.trim()}
                                         className="flex-[2] py-4 rounded-2xl bg-theme-brand text-white font-black hover:brightness-110 active:scale-95 disabled:grayscale disabled:opacity-50 shadow-lg shadow-theme-brand/30 transition-all"
                                     >
                                         {editingItem ? t('save') : t('addShoppingItem')}
                                     </button>
                                 </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
